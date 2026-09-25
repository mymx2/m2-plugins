# 证据模型：节点、边、置信度

步骤 2（识别核心系统）和步骤 3（深入分析）在脑内建的就是这个模型——报告里的每个节点（系统/模块/数据库/外部服务）和每条边（调用/读写/依赖）都必须能落到这个模型的字段上。它把"先读后写"从口号变成可核对的结构：写不进模型的论断，就是还没读过证据的论断。

## 节点字段

| 字段       | 取值                                                                           | 说明                                                |
| ---------- | ------------------------------------------------------------------------------ | --------------------------------------------------- |
| id         | `service.order-api` 形式                                                       | 类型.名称                                           |
| type       | service / module / database / queue / external-system / actor / cloud-resource | 节点类别                                            |
| state      | current / target / deprecated / unknown                                        | 现状还是规划；报告默认只写 current，target 必须标注 |
| sourceRefs | `["src/order/routes.ts", "k8s/order.yaml"]`                                    | 证据文件路径，可带行号                              |
| confidence | high / medium / low / unknown                                                  | 见下方分级                                          |

## 边字段

| 字段                    | 取值                                                                      |
| ----------------------- | ------------------------------------------------------------------------- |
| from / to               | 两端节点 id                                                               |
| type                    | calls / reads / writes / publishes / subscribes / depends-on / deploys-to |
| sync                    | sync / async / batch / unknown                                            |
| protocol                | HTTP / gRPC / SQL / Kafka / file / in-process / unknown                   |
| sourceRefs / confidence | 同节点                                                                    |

## 证据类型

- **code**：import、handler、client、repository、注解、测试
- **contract**：OpenAPI、AsyncAPI、Protobuf、GraphQL schema
- **config**：环境变量、服务发现、路由、feature flag、包清单
- **data**：数据库 schema、migration、ORM 映射、cache key
- **runtime**：日志、trace、指标、服务注册表、部署清单
- **document**：README、ADR、设计文档、runbook、事故复盘
- **human-assumption**：显式标注的访谈/用户陈述/推断

## 置信度分级

| 证据来源                             | 置信度           |
| ------------------------------------ | ---------------- |
| 代码中的 import / require            | high             |
| k8s Service + Deployment YAML        | high             |
| 已部署的 OpenAPI spec                | high             |
| docker-compose 的 ports + depends_on | medium           |
| README 描述的依赖                    | low              |
| 从文件/目录命名推断                  | low              |
| 无代码证据，仅用户口述               | human-assumption |

## 验证规则

- 现状节点至少需要一个 high 或 medium 证据源，否则不进报告或标注为 unknown。
- 推断出来的边必须 `confidence: low` 且 sourceRefs 指向推断依据，并在报告里写为推断。
- 只在运行时观察到的关系（日志里的调用、服务注册表里的实例），未经代码或配置确认，不得写成静态设计。
- 把 README 描述的依赖提升为 high 之前，必须找到代码证据。
- 标为 unknown 的节点比漏掉的节点好——"我们不知道谁调它"是有效信息，假装它不存在不是。
