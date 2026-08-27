#!/usr/bin/env python3
"""Agent Plugins Spec v1.0.0 仓库验证器。

根据 Agent Plugins Specification v1.0.0 验证 plugins/ 目录下各插件的结构：
https://github.com/agentplugins/agent-plugins-spec/blob/main/spec/1.0.0.md

验证策略：
1. 组件路径优先从 plugin.json 的 extensions 数据路由（§8）。
2. 未在 extensions 中声明的组件，回退到默认位置发现（§6）。
3. 缺失组件不报错（§6.2），但位置存在且类型错误时报错。

用法：
    python validate_repo.py <项目根目录>
    python validate_repo.py <项目根目录> -p <插件名>
    python validate_repo.py <项目根目录> --json
"""

from __future__ import annotations

import argparse
import json
import posixpath
import re
import sys
import tempfile
import zipfile
from dataclasses import dataclass
from pathlib import Path
from typing import Any

# ============================================================
# 常量配置
# ============================================================

# 插件存放目录名称。
PLUGINS_DIR = "plugins"

# 插件清单文件名（spec §5.1）。
MANIFEST_FILENAME = "plugin.json"

# 插件清单路径模式（用于错误提示）。
MANIFEST_PATTERN = f"{PLUGINS_DIR}/<plugin>/{MANIFEST_FILENAME}"

# plugin.json 允许的顶级字段（spec §5.2 封闭模式）。
ALLOWED_MANIFEST_FIELDS = {
    "$schema",
    "name",
    "version",
    "description",
    "author",
    "homepage",
    "repository",
    "license",
    "keywords",
    "extensions",
}

# plugin.json 必填字段（spec §5.3）。
REQUIRED_MANIFEST_FIELDS = {"$schema", "name"}

# 标准 $schema 值。
CANONICAL_PLUGIN_SCHEMA = "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json"
CANONICAL_MCP_SCHEMA = "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json"

# 禁止的文件/目录名（OS 生成或本地状态文件）。
FORBIDDEN_PARTS = {
    "__MACOSX",
    ".DS_Store",
    "settings.local.json",
}

# 禁止文件扫描时跳过的顶层目录（依赖、构建产物等）。
FORBIDDEN_SCAN_SKIP = {"node_modules", "dist", ".git"}

# 后缀为 -example 的插件目录视为示例，跳过验证。
EXAMPLE_SUFFIX = "-example"


# ============================================================
# 组件类型定义
# ============================================================
# 每个组件的兜底位置和类型约束。
#
# kind 含义：
#   "dir"   → 兜底位置是目录（如 skills/）
#   "file"  → 兜底位置是文件（如 mcp.json）
#   "either"→ 兜底位置可以是目录或文件（如 rules/）
#
# suffix: 当类型为文件时要求的后缀（None 表示不限制）。
#
# extensions 数据中的路径优先级高于兜底位置。


@dataclass
class ComponentSpec:
    """组件类型规格定义。"""

    fallback: str  # 兜底位置（相对插件根目录）
    kind: str  # "dir" | "file" | "either"
    suffix: str | None = None  # 文件后缀要求


COMPONENT_SPECS: dict[str, ComponentSpec] = {
    "skills": ComponentSpec("skills", "dir"),
    "mcpServers": ComponentSpec("mcp.json", "file", ".json"),
    "rules": ComponentSpec("rules", "either"),
    "agents": ComponentSpec("agents", "either"),
    "hooks": ComponentSpec("hooks", "either", ".json"),
    "commands": ComponentSpec("commands", "either"),
}

# 扩展命名空间中可能出现的其他字段（无兜底位置，仅在 extensions 中声明时检查）。
EXTRA_EXTENSION_FIELDS = {"logo", "workflows", "init", "displayName", "descriptionZh", "category", "tags"}


# ============================================================
# 数据类 & 报告器
# ============================================================


@dataclass
class Issue:
    """验证中发现的问题。"""

    level: str  # "error" | "warning"
    message: str


class Reporter:
    """收集验证问题。"""

    def __init__(self) -> None:
        self.issues: list[Issue] = []

    def error(self, msg: str) -> None:
        self.issues.append(Issue("error", msg))

    def warn(self, msg: str) -> None:
        self.issues.append(Issue("warning", msg))

    @property
    def has_errors(self) -> bool:
        return any(i.level == "error" for i in self.issues)


# ============================================================
# 工具函数
# ============================================================


def load_json(path: Path, reporter: Reporter, label: str) -> Any | None:
    """安全加载 JSON 文件。"""
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        reporter.error(f"{label} 缺失: {path}")
    except json.JSONDecodeError as exc:
        reporter.error(f"{label} JSON 无效: {path}:{exc.lineno}:{exc.colno}: {exc.msg}")
    except OSError as exc:
        reporter.error(f"{label} 无法读取: {path}: {exc}")
    return None


def is_url(value: str) -> bool:
    return value.startswith(("http://", "https://"))


def normalize_path(value: str) -> str:
    """去除 './' 前缀。"""
    return value.removeprefix("./")


def validate_plugin_path(
    value: str,
    field_name: str,
    reporter: Reporter,
    *,
    suffix: str | None = None,
) -> None:
    """验证插件相对路径的合法性（spec §4.1）。

    路径必须以 './' 开头，不能穿越插件根目录。
    """
    if is_url(value):
        reporter.warn(f"{field_name} 使用了远程 URL: {value}")
        return
    if not value.startswith("./"):
        reporter.error(f"{field_name} 路径必须以 './' 开头: {value}")
    normalized = normalize_path(value)
    if normalized == "" or normalized.startswith("/") or ".." in normalized.split("/"):
        reporter.error(f"{field_name} 路径不能超出插件根目录: {value}")
    if suffix and not normalized.endswith(suffix):
        reporter.error(f"{field_name} 路径应以 {suffix} 结尾: {value}")


def path_exists(plugin_root: Path, manifest_path: str) -> bool:
    """检查路径是否存在。URL 视为存在。"""
    if is_url(manifest_path):
        return True
    return (plugin_root / normalize_path(manifest_path)).exists()


def read_frontmatter(path: Path) -> dict[str, str] | None:
    """读取 Markdown 文件的 YAML frontmatter。"""
    try:
        text = path.read_text(encoding="utf-8")
    except OSError:
        return None
    match = re.match(r"^---\s*\n(.*?)\n---\s*(?:\n|$)", text, re.DOTALL)
    if not match:
        return None
    result: dict[str, str] = {}
    current_key: str | None = None
    for raw_line in match.group(1).splitlines():
        if not raw_line.strip():
            continue
        if raw_line.startswith((" ", "\t")) and current_key:
            result[current_key] = (result[current_key] + " " + raw_line.strip()).strip()
            continue
        key, sep, value = raw_line.partition(":")
        if sep:
            current_key = key.strip()
            result[current_key] = value.strip().strip('"').strip("'")
    return result


# ============================================================
# §5 清单验证
# ============================================================


def validate_manifest(plugin_dir: Path, reporter: Reporter) -> dict[str, Any] | None:
    """验证 plugin.json（spec §5）。

    - 必填字段：$schema, name（§5.3）
    - 未知顶级字段：报告并忽略（§5.2）
    - 名称约束（§5.5）
    - author 对象结构（§5.4）
    """
    tag = plugin_dir.name
    manifest = load_json(plugin_dir / MANIFEST_FILENAME, reporter, f"清单 ({tag})")
    if manifest is None:
        return None
    if not isinstance(manifest, dict):
        reporter.error(f"[{tag}] 清单必须是 JSON 对象")
        return None

    # §5.2 未知顶级字段（非致命，report and ignore）
    for key in manifest:
        if key not in ALLOWED_MANIFEST_FIELDS:
            reporter.warn(f"[{tag}] 未知的顶级字段（已忽略）: {key}")

    # §5.3 必填字段
    for field_name in REQUIRED_MANIFEST_FIELDS:
        val = manifest.get(field_name)
        if val is None:
            reporter.error(f"[{tag}] 缺少必填字段: {field_name}")
        elif not isinstance(val, str) or not val.strip():
            reporter.error(f"[{tag}] 字段 {field_name} 必须是非空字符串")

    # $schema 值校验（schema: const）
    schema_val = manifest.get("$schema")
    if isinstance(schema_val, str) and schema_val != CANONICAL_PLUGIN_SCHEMA:
        reporter.warn(f"[{tag}] $schema 不是当前规范版本: {schema_val}")

    # keywords 必须是 string[]（schema: type array, items string）
    keywords = manifest.get("keywords")
    if keywords is not None and (not isinstance(keywords, list) or not all(isinstance(k, str) for k in keywords)):
        reporter.error(f"[{tag}] keywords 必须是字符串数组")

    # extensions 值必须都是对象（schema: additionalProperties type object）
    ext = manifest.get("extensions")
    if ext is not None and isinstance(ext, dict):
        for ns_key, ns_val in ext.items():
            if not isinstance(ns_val, dict):
                reporter.warn(f"[{tag}] extensions.{ns_key} 不是对象（已忽略）")

    # §5.4 author 结构
    author = manifest.get("author")
    if isinstance(author, dict):
        for k, v in author.items():
            if k not in {"name", "email", "url"}:
                reporter.error(f"[{tag}] author 包含未知字段: {k}")
            elif not isinstance(v, str):
                reporter.error(f"[{tag}] author.{k} 必须是字符串")

    # §5.5 名称约束
    name = manifest.get("name")
    if isinstance(name, str) and name.strip():
        if len(name) > 64:
            reporter.error(f"[{tag}] 名称超过 64 字符: {name}")
        if not re.fullmatch(r"[a-z0-9.\-]+", name):
            reporter.error(f"[{tag}] 名称含非法字符（仅 a-z 0-9 - .）: {name}")
        if not (name[0].isalnum() and name[-1].isalnum()):
            reporter.error(f"[{tag}] 名称首尾必须是字母或数字: {name}")
        if "--" in name or ".." in name:
            reporter.error(f"[{tag}] 名称不允许连续 '--' 或 '..': {name}")

    return manifest


# ============================================================
# 组件验证（统一入口 + 类型特化）
# ============================================================


def validate_component(
    component_name: str,
    resolved_path: Path,
    plugin_dir: Path,
    reporter: Reporter,
    *,
    spec: ComponentSpec | None = None,
    source: str = "",
) -> None:
    """验证单个组件（统一入口）。

    Args:
        component_name: 组件类型名（如 "skills"）。
        resolved_path: 解析后的文件系统路径。
        plugin_dir: 插件根目录。
        reporter: 报告器。
        spec: 组件规格（兜底类型检查用）。
        source: 来源描述（如 "extensions" 或 "兜底"）。
    """
    tag = plugin_dir.name
    label = f"[{tag}] {component_name}"
    # 类型特化验证
    if component_name == "skills":
        _validate_skills(resolved_path, plugin_dir, reporter)
    elif component_name == "mcpServers":
        _validate_mcp(resolved_path, plugin_dir, reporter)
    elif component_name == "hooks":
        # hooks 如果是文件，验证 JSON 格式
        if resolved_path.is_file():
            data = load_json(resolved_path, reporter, label)
            if data is not None and not isinstance(data, dict):
                reporter.error(f"{label} 文件必须是 JSON 对象")
        # hooks 如果是目录，不做深层验证
    elif component_name == "commands":
        # commands 如果是目录，检查是否包含 .md 文件（仅信息性）
        pass
    # rules, agents, 其他: 仅验证存在性（已在调用方完成）


def _validate_skills(skills_path: Path, plugin_dir: Path, reporter: Reporter) -> None:
    """验证技能目录（spec §7.1）。

    扫描直接子目录，寻找包含 SKILL.md 的子目录。不递归更深层级。
    """
    tag = plugin_dir.name
    if not skills_path.is_dir():
        reporter.error(f"[{tag}] skills 路径存在但不是目录: {skills_path.relative_to(plugin_dir)}")
        return

    seen_names: dict[str, Path] = {}
    for child in sorted(skills_path.iterdir()):
        if not child.is_dir():
            continue
        skill_md = child / "SKILL.md"
        if not skill_md.exists() or not skill_md.is_file():
            continue

        fm = read_frontmatter(skill_md)
        if fm is None:
            reporter.error(f"[{tag}] 技能缺少 frontmatter: {skill_md.relative_to(plugin_dir)}")
            continue

        name = fm.get("name", "").strip()
        desc = fm.get("description", "").strip()
        if not name:
            reporter.error(f"[{tag}] 技能缺少 name: {skill_md.relative_to(plugin_dir)}")
        if not desc:
            reporter.error(f"[{tag}] 技能缺少 description: {skill_md.relative_to(plugin_dir)}")

        if name:
            prev = seen_names.get(name)
            if prev:
                reporter.error(
                    f"[{tag}] 技能名重复 '{name}': {prev.relative_to(plugin_dir)} 和 {skill_md.relative_to(plugin_dir)}"
                )
            seen_names[name] = skill_md


def _validate_mcp(mcp_path: Path, plugin_dir: Path, reporter: Reporter) -> None:
    """验证 MCP 配置文件（spec §7.2，mcp.schema.json）。

    简化校验，不引入 jsonschema，但覆盖 schema 关键约束：
    - 只允许 $schema + mcpServers 两个顶级字段
    - 每个服务器 type 必须是 stdio / streamable-http / sse
    - stdio: command 必填，env 不能有 PLUGIN_ROOT/PLUGIN_DATA，
             cwd 必须以 ./ 或 ${PLUGIN_ROOT} 或 ${PLUGIN_DATA} 开头
    - streamable-http / sse: url 必填
    """
    tag = plugin_dir.name
    if not mcp_path.is_file():
        reporter.error(f"[{tag}] mcp 路径存在但不是文件: {mcp_path.relative_to(plugin_dir)}")
        return

    data = load_json(mcp_path, reporter, f"MCP ({tag})")
    if data is None:
        return
    if not isinstance(data, dict):
        reporter.error(f"[{tag}] mcp.json 必须是 JSON 对象")
        return

    # mcp.schema.json: additionalProperties false，只允许 $schema + mcpServers
    allowed_mcp_fields = {"$schema", "mcpServers"}
    for key in data:
        if key not in allowed_mcp_fields:
            reporter.error(f"[{tag}] mcp.json 包含未知字段: {key}")

    schema = data.get("$schema")
    if schema is None:
        reporter.error(f"[{tag}] mcp.json 缺少 $schema")
    elif schema != CANONICAL_MCP_SCHEMA:
        reporter.warn(f"[{tag}] mcp.json $schema 不是当前规范版本: {schema}")

    servers = data.get("mcpServers")
    if servers is None:
        reporter.error(f"[{tag}] mcp.json 缺少 mcpServers")
        return
    if not isinstance(servers, dict):
        reporter.error(f"[{tag}] mcp.json 中 mcpServers 必须是对象")
        return

    known_types = {"stdio", "streamable-http", "sse"}

    for sname, sconf in servers.items():
        if not isinstance(sconf, dict):
            reporter.error(f"[{tag}] MCP 服务器 '{sname}' 必须是对象")
            continue

        stype = sconf.get("type")
        if stype not in known_types:
            reporter.error(f"[{tag}] 服务器 '{sname}' type 无效（应为 stdio/streamable-http/sse）: {stype}")
            continue

        if stype == "stdio":
            cmd = sconf.get("command")
            if cmd is None or not isinstance(cmd, str) or not cmd:
                reporter.error(f"[{tag}] stdio 服务器 '{sname}' 缺少 command")
            elif cmd.startswith(".") and ".." in normalize_path(cmd).split("/"):
                reporter.error(f"[{tag}] 服务器 '{sname}' command 路径穿越: {cmd}")

            # env 不能使用保留键 PLUGIN_ROOT / PLUGIN_DATA
            env = sconf.get("env")
            if isinstance(env, dict):
                for reserved in ("PLUGIN_ROOT", "PLUGIN_DATA"):
                    if reserved in env:
                        reporter.error(f"[{tag}] 服务器 '{sname}' env 不能使用保留键: {reserved}")

            # cwd 必须以 ./ 或 ${PLUGIN_ROOT} 或 ${PLUGIN_DATA} 开头
            cwd = sconf.get("cwd")
            if cwd is not None and isinstance(cwd, str):
                valid_prefixes = ("./", "${PLUGIN_ROOT}", "${PLUGIN_DATA}")
                if not any(cwd == p or cwd.startswith((p + "/", p + "\\")) for p in valid_prefixes):
                    reporter.error(
                        f"[{tag}] 服务器 '{sname}' cwd 必须以 ./ 或 ${{PLUGIN_ROOT}} 或 ${{PLUGIN_DATA}} 开头: {cwd}"
                    )

        elif stype in ("streamable-http", "sse"):
            url = sconf.get("url")
            if url is None or not isinstance(url, str) or not url:
                reporter.error(f"[{tag}] {stype} 服务器 '{sname}' 缺少 url")
            elif not is_url(url):
                reporter.error(f"[{tag}] 服务器 '{sname}' url 无效: {url}")


# ============================================================
# §8 扩展数据收集 + 组件路由
# ============================================================


def collect_extension_paths(
    manifest: dict[str, Any],
    plugin_dir: Path,
    reporter: Reporter,
) -> dict[str, str]:
    """从所有 extensions 命名空间中收集组件路径。

    遍历 extensions 下每个命名空间，提取已知的组件字段路径。
    对每个路径进行格式校验和存在性校验。

    Args:
        manifest: 已解析的清单。
        plugin_dir: 插件目录。
        reporter: 报告器。

    Returns:
        {组件名: 路径字符串} 的字典，仅包含有声明的组件。
    """
    ext_data = manifest.get("extensions")
    if not isinstance(ext_data, dict):
        return {}

    routed: dict[str, str] = {}

    for ns, ns_obj in ext_data.items():
        if not isinstance(ns_obj, dict):
            continue

        # 检查所有已知组件字段
        all_known_fields = set(COMPONENT_SPECS.keys()) | EXTRA_EXTENSION_FIELDS
        for field_name in all_known_fields:
            value = ns_obj.get(field_name)
            if value is None:
                continue

            # 仅对路径字符串做路由和验证
            if isinstance(value, str):
                # 判断是否为路径（以 './' 开头）
                if not value.startswith("./"):
                    continue  # 非路径值（如 displayName、category 等），跳过

                field_label = f"extensions.{ns}.{field_name}"

                # 确定后缀要求
                suffix = None
                if field_name in COMPONENT_SPECS:
                    suffix = COMPONENT_SPECS[field_name].suffix
                elif field_name == "logo":
                    suffix = None  # logo 不限制后缀

                validate_plugin_path(value, field_label, reporter, suffix=suffix)

                if not is_url(value) and path_exists(plugin_dir, value) and field_name in COMPONENT_SPECS:
                    routed[field_name] = value
                elif is_url(value) and field_name in COMPONENT_SPECS:
                    routed[field_name] = value
                # else: 路径不存在，静默跳过（§6.2 缺失不报错）

    return routed


# ============================================================
# 禁止文件检查
# ============================================================


def validate_forbidden_files(root: Path, reporter: Reporter, tag: str = "") -> None:
    """检查禁止文件，自动跳过 node_modules 等目录。"""
    prefix = f"[{tag}] " if tag else ""

    def _scan(d: Path) -> None:
        try:
            entries = list(d.iterdir())
        except PermissionError:
            return
        for entry in entries:
            if entry.is_dir() and entry.name in FORBIDDEN_SCAN_SKIP:
                continue
            if entry.name in FORBIDDEN_PARTS:
                reporter.error(f"{prefix}不应包含的状态文件: {entry.relative_to(root)}")
            if entry.is_dir():
                _scan(entry)

    _scan(root)


# ============================================================
# 插件级验证入口
# ============================================================


def validate_plugin(plugin_dir: Path, reporter: Reporter) -> None:
    """验证单个插件。

    流程：
    1. 清单验证（§5）
    2. 禁止文件检查
    3. 从 extensions 收集路由路径（§8）→ 验证已路由组件
    4. 未路由组件 → 回退到默认位置发现（§6）
    """
    tag = plugin_dir.name

    # 1. 清单验证
    manifest = validate_manifest(plugin_dir, reporter)
    if manifest is None:
        return

    # 2. 禁止文件
    validate_forbidden_files(plugin_dir, reporter, tag)

    # 3. 从 extensions 收集路由
    routed = collect_extension_paths(manifest, plugin_dir, reporter)

    # 验证已路由的组件（extensions 声明了路径的）
    for comp_name, comp_path_str in routed.items():
        resolved = plugin_dir / normalize_path(comp_path_str)
        if resolved.exists():
            validate_component(
                comp_name,
                resolved,
                plugin_dir,
                reporter,
                spec=COMPONENT_SPECS.get(comp_name),
                source="extensions",
            )

    # 4. 未路由组件 → 兜底位置
    for comp_name, comp_spec in COMPONENT_SPECS.items():
        if comp_name in routed:
            continue  # 已通过 extensions 路由，不重复检查

        fallback_path = plugin_dir / comp_spec.fallback

        # §6.2: 位置缺失不报错
        if not fallback_path.exists():
            continue

        # 位置存在但类型错误
        if comp_spec.kind == "dir" and not fallback_path.is_dir():
            reporter.error(f"[{tag}] {comp_spec.fallback}/ 存在但不是目录")
            continue
        if comp_spec.kind == "file" and not fallback_path.is_file():
            reporter.error(f"[{tag}] {comp_spec.fallback} 存在但不是文件")
            continue
        # "either": 目录或文件均可

        # 验证组件
        validate_component(
            comp_name,
            fallback_path,
            plugin_dir,
            reporter,
            spec=comp_spec,
            source="兜底",
        )


# ============================================================
# 插件发现
# ============================================================


def discover_plugins(root: Path, reporter: Reporter) -> list[Path]:
    """扫描 plugins/ 目录，发现有效插件（跳过 -example）。"""
    plugins_root = root / PLUGINS_DIR
    if not plugins_root.exists():
        reporter.error(f"项目缺少插件目录: {plugins_root}")
        return []
    if not plugins_root.is_dir():
        reporter.error(f"'{PLUGINS_DIR}' 不是目录: {plugins_root}")
        return []

    plugin_dirs: list[Path] = []
    for child in sorted(plugins_root.iterdir()):
        if not child.is_dir():
            continue
        if child.name.endswith(EXAMPLE_SUFFIX):
            continue
        if (child / MANIFEST_FILENAME).exists():
            plugin_dirs.append(child)
        else:
            reporter.warn(f"插件目录 '{child.name}' 缺少 {MANIFEST_FILENAME}")

    if not plugin_dirs:
        reporter.warn(f"'{PLUGINS_DIR}/' 下无有效插件（已跳过 -example 目录）")

    return plugin_dirs


def validate_project(
    root: Path,
    reporter: Reporter,
    *,
    plugin_name: str | None = None,
) -> None:
    """验证项目结构。"""
    if not root.exists():
        reporter.error(f"目标不存在: {root}")
        return
    if not root.is_dir():
        reporter.error(f"目标不是目录: {root}")
        return

    validate_forbidden_files(root, reporter)

    if plugin_name:
        plugin_dir = root / PLUGINS_DIR / plugin_name
        if not plugin_dir.is_dir():
            reporter.error(f"插件目录不存在: {plugin_dir}")
            return
        validate_plugin(plugin_dir, reporter)
    else:
        for plugin_dir in discover_plugins(root, reporter):
            validate_plugin(plugin_dir, reporter)


# ============================================================
# ZIP 处理
# ============================================================


def safe_extract_zip(
    zip_path: Path,
    destination: Path,
    reporter: Reporter,
) -> Path | None:
    """安全解压 ZIP。"""
    try:
        with zipfile.ZipFile(zip_path) as archive:
            names = [n for n in archive.namelist() if n and not n.endswith("/")]
            for n in names:
                norm = posixpath.normpath(n)
                if norm.startswith(("../", "/")):
                    reporter.error(f"ZIP 包含不安全路径: {n}")
                    return None
            has = any(
                n.startswith(f"{PLUGINS_DIR}/") and n.count("/") >= 2 and n.endswith(f"/{MANIFEST_FILENAME}")
                for n in names
            )
            if not has:
                reporter.error(f"ZIP 缺少 {MANIFEST_PATTERN}")
                return None
            archive.extractall(destination)
    except zipfile.BadZipFile:
        reporter.error(f"无效 ZIP: {zip_path}")
        return None
    except OSError as exc:
        reporter.error(f"无法读取 ZIP: {zip_path}: {exc}")
        return None
    return destination


# ============================================================
# 主入口
# ============================================================


def run(target: Path, *, plugin_name: str | None = None) -> tuple[Reporter, Path | None]:
    reporter = Reporter()
    if target.is_file() and target.suffix.lower() == ".zip":
        td = tempfile.TemporaryDirectory(prefix="repo-validate-")
        root = safe_extract_zip(target, Path(td.name), reporter)
        if root is not None:
            validate_project(root, reporter, plugin_name=plugin_name)
        td.cleanup()
        return reporter, target
    validate_project(target, reporter, plugin_name=plugin_name)
    return reporter, target


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description=f"Agent Plugins v1.0.0 验证器。扫描 {PLUGINS_DIR}/ 并逐一验证。")
    parser.add_argument("target", help="项目根目录或 ZIP 路径")
    parser.add_argument(
        "--plugin",
        "-p",
        default=None,
        help=f"指定插件名（{PLUGINS_DIR}/<name>/），省略则全部（跳过 -example）",
    )
    parser.add_argument("--json", action="store_true", help="JSON 输出")
    args = parser.parse_args(argv)

    target = Path(args.target).expanduser().resolve()
    reporter, label = run(target, plugin_name=args.plugin)

    if args.json:
        print(
            json.dumps(
                {
                    "target": str(label or target),
                    "ok": not reporter.has_errors,
                    "issues": [i.__dict__ for i in reporter.issues],
                },
                indent=2,
                ensure_ascii=False,
            )
        )
    else:
        scope = f"插件 '{args.plugin}'" if args.plugin else "所有插件（跳过 -example）"
        print(f"验证: {label or target} ({scope})")
        if reporter.issues:
            for issue in reporter.issues:
                pfx = "错误" if issue.level == "error" else "警告"
                print(f"{pfx}: {issue.message}")
        else:
            print("通过: 未发现问题")

    return 1 if reporter.has_errors else 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
