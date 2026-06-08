INSERT INTO cards (id, name, description, url, type, icon, preview_url, source_domain, tags, notes, is_archived, is_favorite, sort_order)
VALUES
  ('00000000-0000-4000-8000-000000000001', 'ChatGPT', '日常 AI 对话、写作、代码和产品构思入口。', 'https://chatgpt.com', 'external_link', 'Sparkles', NULL, 'chatgpt.com', JSON_ARRAY('AI', '写作', '效率'), '常用入口。', FALSE, TRUE, 10),
  ('00000000-0000-4000-8000-000000000002', 'OpenAI Docs', 'OpenAI API、模型和开发者文档。', 'https://platform.openai.com/docs', 'doc', 'BookOpen', NULL, 'platform.openai.com', JSON_ARRAY('文档', 'API', '开发'), '', FALSE, FALSE, 20),
  ('00000000-0000-4000-8000-000000000003', 'Prompt Library', '个人沉淀的提示词和工作流案例。', '/prompts', 'my_app', 'Library', NULL, '', JSON_ARRAY('本地', '提示词'), '站内路径示例。', FALSE, TRUE, 30),
  ('00000000-0000-4000-8000-000000000004', 'Perplexity', '用于联网搜索、资料整理和事实核查。', 'https://www.perplexity.ai', 'external_link', 'Search', NULL, 'perplexity.ai', JSON_ARRAY('搜索', '研究'), '', FALSE, FALSE, 40),
  ('00000000-0000-4000-8000-000000000005', 'AI Interface Gallery', '收集 AI 产品界面、交互模式和灵感案例。', 'https://mobbin.com', 'inspiration', 'Images', NULL, 'mobbin.com', JSON_ARRAY('灵感', 'UI'), '', FALSE, FALSE, 50),
  ('00000000-0000-4000-8000-000000000006', 'NotebookLM', '资料阅读、摘要和知识整理工具。', 'https://notebooklm.google', 'external_link', 'NotebookTabs', NULL, 'notebooklm.google', JSON_ARRAY('研究', '知识管理'), '', TRUE, FALSE, 60);

INSERT INTO lists (id, name, description, kind, filters, sort_order)
VALUES
  ('10000000-0000-4000-8000-000000000001', '常用 AI 工具', '手动维护的高频入口。', 'manual', JSON_OBJECT('searchQuery', '', 'type', '', 'tags', JSON_ARRAY(), 'archived', 'active', 'favorite', ''), 10),
  ('10000000-0000-4000-8000-000000000002', '研究资料', '自动汇总带有研究标签的未归档卡片。', 'smart', JSON_OBJECT('searchQuery', '', 'type', '', 'tags', JSON_ARRAY('研究'), 'archived', 'active', 'favorite', ''), 20);

INSERT INTO card_lists (list_id, card_id, sort_order)
VALUES
  ('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', 10),
  ('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000003', 20);
