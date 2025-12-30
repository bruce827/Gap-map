# Story 2.4: 个性化收藏/标签/笔记（LocalStorage）（Phase 2）

Status: backlog

## Story

As a 用户,
I want 收藏感兴趣的城市，并为它们打标签、写个人笔记,
so that 我可以在探索过程中沉淀决策材料并管理候选清单。

## Acceptance Criteria

1. 收藏可用：用户可以将城市加入/移出收藏（至少在详情页有按钮）。
2. 标签可用：用户可以为已收藏城市添加 0-N 个自定义标签（如“备选/已考察/待深入了解”）。
3. 笔记可用：用户可以为已收藏城市添加一段文本笔记。
4. 持久化：刷新页面后收藏/标签/笔记仍保留（LocalStorage）。
5. 列表页可用：存在一个“我的收藏”列表视图，可按标签筛选（最小可用）。
6. 数据隔离：所有个性化数据仅在本地浏览器保存，不上传到服务端（Phase 2 范围内）。

## Tasks / Subtasks

- [ ] Task 1：设计本地数据结构（AC: 4, 6）
  - [ ] 例如：`favorites: { [cityId]: { tags: string[], note: string, updatedAt: string } }`

- [ ] Task 2：实现收藏交互（AC: 1）
  - [ ] 详情页按钮：收藏/取消收藏
  - [ ] 列表页入口：我的收藏

- [ ] Task 3：实现标签与笔记（AC: 2-3）
  - [ ] 标签：新增/删除/去重
  - [ ] 笔记：编辑/保存

- [ ] Task 4：实现收藏列表页（AC: 5）
  - [ ] 展示收藏城市（至少名称 + 标签 + 笔记摘要）
  - [ ] 按标签筛选（最小可用）

- [ ] Task 5：最小自测记录（AC: 1-6）
  - [ ] 截图：收藏按钮
  - [ ] 截图：标签与笔记
  - [ ] 截图：刷新后仍保留

## Dev Notes

### 数据来源

- 收藏清单仅存储城市标识与少量用户数据；城市的“静态/动态指标”仍来自 `GET /api/cities` 等接口。

### References

- [Source: docs/prd/prd-product.md#功能6: 个性化收藏与标签]

## Dev Agent Record

### Agent Model Used

Cascade
