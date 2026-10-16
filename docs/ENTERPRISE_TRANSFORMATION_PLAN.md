# خطة التحول المؤسسي لمشروع إنجاز

**حالة الوثيقة:** خطة تنفيذية مشروطة بالأدلة المتاحة، وليست شهادة جاهزية أو اعتمادًا إنتاجيًا  
**نطاق المصدر:** نتائج التدقيق المقدمة فقط على الشيفرة، الهجرات، الاختبارات، وملفات CI/CD المشار إليها في نتائج التدقيق.  
**تاريخ الأساس:** كما ورد في نتائج التدقيق، ولا يُفترض أن يعكس هذا المستند أي تغيير لاحق في المستودع أو البيئة.  
**قاعدة القرار:** لا تُعد أي فجوة مغلقة إلا بعد اختبار قابل لإعادة التنفيذ على قاعدة/بيئة نشر مماثلة، مع دليل محفوظ ومالك وقرار قبول.

## 1. الملخص التنفيذي

إنجاز يملك نواة تطبيقية قابلة للبناء تشمل API، PostgreSQL/Supabase، طوابير تنفيذ، عزلًا تطبيقيًا في بعض المسارات، تخزين أسرار مشفّرًا، وطبقات أولية للموظفين والمهام والموافقات والتكاملات. لكن النتيجة الحالية ليست منصة مؤسسية جاهزة للاعتماد: توجد فجوتان **P0** تمسان حدود المؤسسة/المستأجر ومسار التخطيط، وفجوات **P1** واسعة في RBAC، سلامة العلاقات، عقد API، الحصص الموزعة، OAuth، webhook ingress، حالة العامل وإعادة المحاولة، تجربة الدخول الفعلية، النسخ والاستعادة، العامل الدائم، والفوترة.

الأولوية ليست إضافة موصلات أو ميزات واجهة جديدة، بل تثبيت **حدود الثقة والبيانات والتنفيذ** ثم تحويلها إلى عقود واختبارات حية. التسلسل المقترح:

1. **إيقاف مخاطر الحدود:** تفعيل RLS فعليًا لجداول المؤسسة والمساحة والعضوية، منع تعديل العضويات مباشرة، والتحقق من المنح الفعلية على Supabase.
2. **توحيد مصدر الهوية والصلاحيات:** نموذج مؤسسي صريح، مصفوفة role-by-action، محرك سياسة واحد، ومسار إدارة عضويات وتدقيق.
3. **إصلاح الاتساق التشغيلي:** توحيد مخطط الذاكرة مع الكود، تثبيت blocked/retry/timeout، ومنع الكتابات المتأخرة أو التكرار غير الآمن.
4. **تأسيس منصة التكامل:** عقد API واحد مولّد، SDK، quota موزعة، OAuth/PKCE، webhook inbox قابل للاسترداد، ثم وضع CRM/ERP/POS فوق الموصل المشترك.
5. **إكمال المنتج الحقيقي:** ربط build بمسار signup/login/onboarding/workspace، وإظهار فشل provisioning بدل ابتلاعه.
6. **إثبات الجاهزية:** worker دائم، backup/restore drill، مراقبة وتنبيهات فعلية، اختبارات حمل واستعادة، ثم قرارات فوترة وامتثال مبنية على أدلة.

مقارنة إنجاز بـ **Salesforce** هنا هي **اتجاه طموح لبناء منصة مؤسسية قابلة للتوسع**، وليست نسخة من Salesforce ولا وعدًا بتكافؤ الوظائف أو الأداء أو الاعتماد. لا يجوز استخدام هذه المقارنة كدليل سوقي أو تشغيلي قبل إغلاق الأدلة والقرارات الواردة أدناه.

## 2. خط الأساس المؤكد والمحدد

### 2.1 ما يثبته التدقيق

| المجال | خط الأساس المثبت من المصدر المفحوص | حدّ الاستنتاج |
|---|---|---|
| الهوية الحالية | المسار الفعّال في API يتحقق من Supabase access token عبر `/auth/v1/user` ويربطه بـ `auth_user_id` وعضوية مساحة العمل. الواجهة المنفذة في الملفات المفحوصة تستخدم password grant/signup/resend. | لا يثبت ذلك وجود SSO/SAML/OIDC أو دورة حياة مؤسسية؛ لم يظهر تنفيذ SSO/SCIM/JIT في الملفات المفحوصة. |
| حدود المؤسسة والعضوية | `workspace_members` ينشأ بأدوار `manager/member/viewer`. لا تظهر في سلسلة الهجرات المفحوصة هجرة صريحة لتفعيل RLS عليه، وتوجد هجرة تحذف سياسة عضوية دون بديل ظاهر. | لا يمكن الجزم بحالة قاعدة منشورة أو منح PostgREST الفعلية دون فحص حي. هذه فجوة P0 يجب إثباتها أو نفيها بالاتصال بقاعدة فعلية. |
| RLS للمؤسسة | `organizations/workspaces/users/workspace_members` لا تظهر لها `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` في سلسلة الهجرات المفحوصة، رغم وجود سياسات في مواضع أخرى. | اختبارات RLS الحقيقية تخطت عند غياب `DATABASE_URL`؛ الاختبار البنيوي لا يثبت النشر. |
| RBAC | توجد بوابة coarse تقريبًا عبر `requireManager`، بينما سياسات موارد أساسية تستخدم `FOR ALL` مع `is_workspace_member`. لا توجد مصفوفة capability مركزية أو مسارات ظاهرة لإدارة الأعضاء والدعوات والأدوار. | وجود عزل تطبيقي في بعض مسارات API لا يثبت عدم وجود bypass عبر Data API. |
| سلامة العلاقات | مفاتيح `tasks/approvals` الظاهرة أحادية العمود ولا تفرض تطابق `workspace_id` مع الموارد المرتبطة على مستوى DB. | لم تُثبت بيانات غير متسقة في بيئة حية؛ الحاجة هي اختبار قيد/trigger فعلي. |
| المدخلات والأسرار | حد JSON إجمالي 1MB، لكن لا يوجد schema موحد لكل endpoint. الأسرار تستخدم AES-256-GCM، مع `ENJAZ_CREDENTIALS_KEY` ثابت ظاهريًا، بلا key id أو مسار دوران مثبت. | لا توجد دلائل على إدارة KMS أو تدوير فعلي خارج المصدر المفحوص. |
| API والتكاملات | نسخ API متعارضة: `0.8.0` في التنفيذ، `0.7.0` في OpenAPI، و`0.11.0` في package. عدد المسارات في OpenAPI أقل من ظهور `/api/v1` في التنفيذ، و`integrations/connections` متكرران. | لم يُثبت عقد عميل خارجي أو توافق نشر حي. |
| الحصص | rate limiter محلي داخل الذاكرة، keyed by socket address، وبـ`Map` لكل عملية. | لا يمكن معرفة topology أو وجود gateway خارجية؛ الاستنتاج يخص الشيفرة المفحوصة. |
| OAuth/webhooks/MCP | لا يظهر OAuth authorization-code/PKCE/refresh للتكاملات. لا يوجد route HTTP ظاهر لـwebhook ingress؛ helper يسجل ثم يضع في queue بلا inbox حالة كاملة. عميل MCP يفتقر إلى DNS pinning/retry العقدي. | لم تُجر اختبارات provider حقيقية أو end-to-end. |
| AI/workflow | `ai-memory.js` يستخدم أعمدة لا يعرّفها المخطط الظاهر. worker يستعمل `blocked` بينما القيود الظاهرة لا تسمح به. retry/timeout قد يترك حالات نهائية متعارضة أو كتابة متأخرة. | لم يُختبر worker طويل التشغيل أو provider خارجي تحت crash/lease/timeout. |
| المنتج | build الحالي يعرض Landing/Preview عامة. `main.tsx` يركّب `App`، ولا يظهر ربط auth/API/workspace من نقطة الدخول. ملفات auth/API منفصلة لا يثبت وجودها في المنتج المبني. | لا يوجد تحقق authenticated E2E ضد بيئة تشغيل. |
| التشغيل | لا توجد آلية مستودعية قابلة للتحقق للـbackup/restore/DR أو نشر worker دائم. CI يشغل migrate على PostgreSQL اختباري ولا يثبت نشر الإنتاج. توجد heartbeats/queue counts، لكن لا يثبت exporter أو alert route. | لا يمكن تأكيد إعدادات Supabase/Vercel/secrets/monitoring خارج المستودع. |
| الفوترة | توجد حدود وقياس استخدام داخليان، ولا يظهر checkout/payment/invoice أو مزامنة webhook خارجية. | لا يمكن استنتاج وجود فوترة مُدارة خارجيًا. |
| الأداء والامتثال | لا توجد أدلة load/soak/benchmark أو region/residency أو GDPR/SOC2/HIPAA/PCI. | لا يجوز ادعاء SLO أو residency أو compliance. |

### 2.2 نتائج الاختبارات الواردة

- الاختبارات المستهدفة لبعض الوظائف: **29/29 ناجحة**.
- اختبارات API: **156 نجاحًا، فشل واحد، و3 متخطاة** عند وجود `OPENAI_API_KEY` في البيئة؛ وبعد عزل متغيرات OpenAI: **157/0/3**.
- اختبارات الويب العامة: **3/3 ناجحة**، وbuild ناجح، لكنها تغطي العرض العام لا التسجيل أو مساحة العمل.
- اختبارات RLS وحدود المستأجر الحقيقية متخطاة عند غياب `DATABASE_URL`؛ لا تُستخدم هذه النتائج كإثبات عزل إنتاجي.

### 2.3 تحديث بعد التدقيق الأولي

على فرع العمل `fix/planning-memory-schema-contract`، عُدّل منسق التخطيط ليستخدم `employee-memory.js` ومخطط `ai_employee_memory` القائم (`summary`, `key`, `source_task_id`) بدل `ai-memory.js` الذي كان يرسل `metadata` ونوع `plan`. أضيف اختبار انحدار للعقد. وعُزل اختبار حالة موفري AI عن `OPENAI_API_KEY` مع التحقق من حالتي التهيئة وعدم تسريب السر. اجتازت الاختبارات المستهدفة (11/11)، وفحوص المصدر، واختبارات الويب (3/3) والبناء، ومجموعة API كاملة مع مفتاح OpenAI وهمي مضبوط (158 ناجحة، 0 فاشلة، 3 متخطاة). **هذا يغلق عدم التوافق على مستوى المصدر فقط؛ لم يُشغّل تخطيط حي على PostgreSQL مطبق عليه كل migrations، لذلك يظل التحقق التشغيلي غير مكتمل.**

## 3. سجل الفجوات حسب الأولوية

> **طريقة القراءة:** الدليل أدناه مختصر من نتائج التدقيق، وليس إعادة تدقيق جديدة. الأولوية كما صنفها التدقيق. لا توجد فجوات P3 مثبتة في نتائج التدقيق؛ يرد ذلك صراحة في آخر الجدول بدل اختراع مستوى ثقة غير مدعوم.

| الأولوية | الفجوة | الدليل المحدد | أثرها | معيار الإغلاق الأولي |
|---|---|---|---|---|
| **P0** | حماية `workspace_members` غير مثبتة وقد تكون قابلة للتعديل عبر Data API | `001_initial.sql:13` ينشئ العضويات دون RLS ظاهر؛ `013_security_policy_hardening.sql:42-45` يحذف سياسة دون بديل؛ `016_ci_rls_roles.sql:7-10` يمنح `authenticated` على جداول `public` | احتمال قراءة/إضافة/تغيير عضوية أو دور `manager` مباشرة، وتجاوز `requireWorkspace` | migration صريحة، default-deny، منح مضبوطة، endpoint خادمي للعضوية، واختبار Supabase فعلي لمستخدمين ومساحتين يمنع cross-tenant وprivilege escalation |
| **P0** | RLS لجداول حدود الهوية والمؤسسة غير مثبتة | `organizations/workspaces/users/workspace_members` بلا تفعيل RLS ظاهر؛ اختبارات E2E تتخطى دون `DATABASE_URL` | قد تكون السياسات غير نافذة عبر Data API | إثبات `pg_class.relrowsecurity` والمنح والسياسات على قاعدة فعلية، واختبار SELECT/INSERT/UPDATE/DELETE بين مستأجرين |
| **P0** | عدم توافق `ai-memory.js` مع schema | الكود يقرأ/يدرج `metadata`؛ المخطط الظاهر ينشئ `key` وحقولًا أخرى ولا يضيف `metadata` | POST التخطيط قد يفشل أو يترك graph/jobs دون اتساق | migration/كود موحد، اختبار schema نظيف لـplan 200 وgraph/job/memory، وتعويض أو transaction عند فشل الحفظ |
| **P1** | RBAC مؤسسي خشن وغير موحد | `requireManager` محدود، وسياسات `FOR ALL` للأعضاء، ولا توجد إدارة members/invites/roles ظاهرة | member/viewer قد يحصل على كتابة مباشرة؛ لا فصل لصلاحيات approval/integration/billing | capability matrix كاملة، policy engine واحد في API/RLS، اختبار كل role عبر API وData API |
| **P1** | علاقات الموارد لا تفرض تطابق مساحة العمل | FKs أحادية العمود في `tasks/approvals`، والتحقق الحالي تطبيقي | إمكانية ربط موارد من مساحتين عبر مسار كتابة مباشر | unique composite keys وcomposite FKs/triggers، واختبار إدراج A مع مورد B يفشل |
| **P1** | عقد API والإصدار وSDK غير موحدة | التنفيذ `0.8.0`، OpenAPI `0.7.0`، package `0.11.0`؛ OpenAPI ناقصة وتكرار `integrations/connections` | كسر العملاء وصعوبة إدارة نسخ/تكاملات | مصدر عقد واحد، namespace canonical وalias مع Deprecation/Sunset، SDK مولد، وCI route/schema/version diff |
| **P1** | rate limit محلي وغير موزع | `Map` داخل العملية، مفتاح socket فقط، لا Redis/Postgres atomic counter | تجاوز عبر instances أو ظلم خلف NAT، واستنزاف بين أنواع الاستخدام | مخزن موزع، key tenant/principal/route/integration، tiers مستقلة، headers و`Retry-After`، واختبار instanceين |
| **P1** | غياب OAuth للتكاملات | `credentials-vault` يقبل `api_key` ويخزن expiry؛ لا authorization/PKCE/callback/refresh/revoke | انقطاع SaaS عند انتهاء token أو استخدام أسرار طويلة العمر | adapter موحد، state/PKCE، refresh lock، revoke/scope/audit، وعدم إعادة الأسرار في API |
| **P1** | webhook ingress غير موصول وinbox غير مكتمل | لا route HTTP ظاهر؛ `webhook-gateway` يدرج ثم enqueue؛ الجدول بلا status/job/error/retry | فقد أحداث أو duplicate دائم عند فشل queue | endpoint raw-body موقّع، inbox pending، transaction/recovery، max attempts/backoff/dead، واختبار duplicate/failure/recovery |
| **P1** | حالة `blocked` غير مسموحة | worker يستدعي `blockJob`؛ قيود `019_*` تحصر الحالات دون `blocked` | approval يتحول إلى fail/dead بدل توقف مستقر | إضافة `blocked` رسميًا أو إزالة المسار، مع DB E2E يمنع duplicate approval ويثبت approve-to-completion |
| **P1** | retry/timeout غير متسقين | graph قد يصير failed ثم تعاد الخطوة؛ `Promise.race` بلا AbortSignal؛ runWorkflow يعيد task failed غير مسموحة | side effects مكررة، كتابة متأخرة، وحالات task/graph متعارضة | مالك retry واحد، attempt/lease/idempotency، AbortSignal أو reconciliation، fault-injection يثبت side effect مرة واحدة |
| **P1** | واجهة المنتج المبنية لا تصل إلى auth/workspace | `main.tsx` يركب `App` فقط؛ `App.tsx` Preview ثابتة؛ auth/API files غير مستوردة في نقطة الدخول | لا يوجد onboarding أو مساحة عمل فعلية من build | Playwright على build نظيف: unauth CTA، login/signup، bootstrap، workspace API، 401/expiry |
| **P1** | فشل provisioning يُبتلع | `auth-gate-v2.js` يعلن authenticated ويعيد reload بعد فشل provisioning؛ notice لا مستهلك له | مؤسسة جزئية دون استرداد واضح | حالة دائمة مع retry/idempotent resume وrequest id، ولا إغلاق قبل تحقق API |
| **P1** | backup/restore/DR غير مثبت | لا ملفات أو اختبار restore؛ baseline يذكر عدم تنفيذ drill؛ لا down/rollback ظاهر | لا إثبات RPO/RTO أو رجوع آمن | backup مُدار/runbook، restore drill قابل للتكرار، migrate وRLS/tenant/queue tests بعد الاستعادة |
| **P1** | worker دائم وmigration gate غير مثبتين | CI بلا deploy للworker؛ `README.worker` يصف خدمة منفصلة؛ لا Dockerfile/manifest/workflow نشر | API قد ينشر مع queue بلا مستهلك | worker دائم مع restart/replicas، migration gate، smoke task claim/complete وSIGTERM/recovery |
| **P1** | الفوترة ليست دورة تحصيل مكتملة | حدود/usage داخلي، ولا checkout/payment/invoice/webhook ظاهر | لا يمكن اعتبار usage تحصيلًا أو entitlements مالية | قرار مؤسس على نموذج الفوترة، state machine وwebhook idempotency/reconciliation واختبار sandbox |
| **P2** | مدخلات غير موحدة | JSON 1MB فقط؛ حقول اعتباطية تمر إلى repository/JSON | أخطاء وسطح إدخال غير منضبط | schema/type/length/depth/key limits، reject unknown، 400/413 قبل إنشاء الصف |
| **P2** | دوران مفتاح التشفير غير مثبت | `ENJAZ_CREDENTIALS_KEY` ثابت ظاهريًا؛ `{v,iv,data}` دون key id/dual-read | صعوبة الدوران والاسترداد والإبطال | KMS/secret manager، key version، re-encrypt transactionally، drill K1→K2 |
| **P2** | MCP لا يثبت DNS/retry/capability | allowlist نصية وtimeout فقط؛ لا DNS pinning/retry/health contract | فشل transient أو خطر DNS rebinding/TOCTOU | فحص A/AAAA public، إعادة تحقق، retry آمن bounded، capability/health/audit |
| **P2** | evals للذكاء الاصطناعي سطحية | تفحص action strings وexpected/forbidden دون تنفيذ/threshold | خطة غير قابلة للتنفيذ قد تمر | golden cases للت schema/DAG/approval/budget/latency/tool execution مع baseline threshold |
| **P2** | اختبار مزود AI غير حتمي | `ai-provider.test.js` لا يعزل `OPENAI_API_KEY` | بوابة CI حمراء أو إخفاء regressions | env hermetic/subprocess واختبار true/false دون تسريب السر |
| **P2** | الوصول والتوطين غير مكتملين | tab/tabpanel بلا علاقات كاملة؛ provisioning بلا live region؛ خلط إنجليزية في RTL | تجربة غير قابلة للاختبار الكامل لقارئات الشاشة أو العربية | WAI-ARIA tabs، live/status/alert، قاموس locale، اختبارات 320/390px وRTL |
| **P2** | المراقبة بلا exporter/تنبيه مثبت | heartbeats وcounts وSentry init بلا import/capture/alert route؛ spans بلا exporter | لا دليل على وصول الإنذارات أو الاستجابة | exporter، capture، queue age/retry/dead/blocked/latency/cost metrics، test alert/on-call |
| **P2** | لا دليل أداء/إقامة بيانات/امتثال | لا load/soak/benchmark أو region/residency أو GDPR/SOC2/HIPAA/PCI evidence | لا SLO أو ادعاء امتثال قابل للدفاع | load/soak على staging، مصفوفة residency/subprocessors، سجل أدلة ومراجعة مستقلة |
| **P3** | لا توجد فجوات P3 مصنفة في نتائج التدقيق | جميع الملاحظات المصنفة في المادة المقدمة P0/P1/P2؛ لا دليل مستقل لمستوى P3 | منع تحويل تحسينات غير مثبتة إلى التزام | إنشاء backlog P3 فقط بقرار مؤسس بعد إغلاق P0/P1، مع مالك ومبرر ودليل جديد؛ لا تُستخدم الفئة لإخفاء فجوة أعلى |

## 4. المراحل وخطة التنفيذ

### المرحلة 0 — الأيام 0–30: إيقاف مخاطر الثقة وإثبات خط الأساس

**الأهداف**

- منع التعديل المباشر غير المصرح به على المؤسسة والمساحة والعضوية.
- تثبيت مسار التخطيط ومخطط الذاكرة قبل إضافة ميزات AI.
- إنشاء بيئة اختبار قاعدة فعلية تعكس الهجرات المنشورة، لا contract tests فقط.
- تجميد التوسع في CRM/ERP/POS والميزات ذات الأثر الجانبي حتى تمر بوابة P0.
- توثيق مصدر schema الفعلي وترتيب migrations والبيئة التي ستُختبر.

**الأعمال والاعتماديات**

1. **قرار المؤسس:** اعتماد owner للهوية/البيانات، وتحديد ما إذا كان `owner/admin` المؤسسي أو دور آخر هو صاحب إدارة العضويات. لا يُنفذ policy جديدة قبل هذا القرار.
2. تطبيق migration صريحة لـRLS على `organizations`, `workspaces`, `users`, `workspace_members`، مع default-deny، وضبط grants، ومنع تغيير `organization_id` أو منح الذات دورًا أعلى.
3. حصر إنشاء/تعديل/إلغاء العضويات في API خادمية مصادق عليها مع audit event وسحب جلسات المستخدم الملغى وفق سياسة معتمدة.
4. بناء اختبار Supabase فعلي بمستخدمين ومساحتين: SELECT/INSERT/UPDATE/DELETE، وتغيير الدور، والوصول عبر Data API مباشرة.
5. اختيار عقد واحد لـ`ai_employee_memory`: إما مواءمة الكود مع schema الحالية أو migration متعمدة؛ منع plan materialization الجزئي عند فشل الذاكرة.
6. إضافة فحص migration/schema في CI وفحص static يمنع import لمسار `auth.js` القديم من production runtime.
7. جعل اختبار AI provider hermetic بعزل متغيرات البيئة.
8. توثيق سجل قرار لا يدعي أن البيئة آمنة قبل فحص `relrowsecurity`, grants, policies, Auth وPostgREST.

**معايير القبول القابلة للقياس**

- اختبار قاعدة فعلية: محاولات B على عضوية A تفشل أو تعيد صفر صفوف في العمليات الأربع، ولا يستطيع B منح نفسه `manager`.
- `pg_class.relrowsecurity` مفعّل للجداول الأربعة، والمنح الفعلية موثقة في artifact CI؛ لا يمر الاختبار عند غياب `DATABASE_URL` بل يفشل بوضوح.
- endpoint إدارة العضويات يقبل owner/admin المخول فقط، وكل تغيير دور ينتج audit event واحدًا على الأقل.
- plan deterministic يعيد HTTP 200 على schema نظيفة، ويثبت graph/job/memory؛ وعند فشل memory لا يبقى graph/job غير قابل للتسوية.
- تشغيل API tests مع `OPENAI_API_KEY` مضبوطًا وعند غيابه يعطي **0 failures** في الحالتين.
- لا يُغلق P0 اعتمادًا على regex أو contract test فقط.

**بوابة الانتقال:** موافقة المؤسس على نموذج authority، ونجاح اختبارات DB الحية، وتوقيع مالك البيانات/الأمن على سجل المنح والسياسات. عند الفشل: تجميد كتابة الميزات الجديدة، لا rollback أعمى للهجرة الأمنية؛ يُستخدم migration تصحيحي مع backup مثبت.

### المرحلة 1 — الأيام 31–90: نموذج المؤسسة والصلاحيات والعقود التشغيلية

**الأهداف**

- تحويل الصلاحيات إلى policy engine ومصفوفة capability قابلة للتدقيق.
- إصلاح سلامة المستأجر على مستوى DB، وإدخال schemas موحدة للـAPI.
- توحيد عقد API والإصدار وroute registry، وإصدار SDK أولي من العقد.
- تثبيت حالات approval/blocked/retry/timeout دون side effects متأخرة.
- ربط build بمسار auth/onboarding/workspace حقيقي.

**الأعمال والاعتماديات**

1. اعتماد مصفوفة roles/capabilities: `owner`, `org_admin`, `workspace_admin`, `operator`, `approver`, `viewer` أو بدائل يقرها المؤسس؛ فصل membership, billing, integration, employee administration, approval.
2. تنفيذ سياسات SELECT/INSERT/UPDATE/DELETE دورية بدل `FOR ALL` الواسعة، واستدعاء policy engine من API وRLS حيث يلزم.
3. إضافة composite unique/FK/triggers للعلاقات متعددة المستأجرين، وتنظيف/اكتشاف أي بيانات غير متسقة قبل تفعيل القيود الصارمة.
4. إضافة schema لكل endpoint: الأنواع، الطول، العمق، عدد المفاتيح، الحقول المسموحة، وفحص action/payload قبل وبعد parsing.
5. اختيار namespace canonical بين `integrations` و`connections`، إبقاء alias مؤقتًا مع `Deprecation` و`Sunset` معلنين، وتوليد OpenAPI/SDK/changelog من مصدر واحد.
6. إعادة تصميم retry بمالك واحد، attempt/lease/idempotency، وإضافة `blocked` رسميًا أو إلغاء المسار وفق قرار هندسي مؤسس عليه اختبار DB.
7. استبدال `Promise.race` وحدها بإلغاء أو reconciliation؛ لا تُقبل الكتابة المتأخرة إذا أصبحت العملية terminal.
8. إدخال auth boundary في الواجهة، signup/login/session recovery، bootstrap، workspace state، ومسار فشل provisioning مع retry.

**معايير القبول القابلة للقياس**

- جدول قبول role-by-action يغطي **كل endpoint وكل جدول**؛ viewer لا يكتب، operator لا يقرر approval، approver لا يدير العضويات، وworkspace admin لا يعبر مساحة أخرى.
- اختبار cross-workspace لإدراج task/approval/audit بمورد من B في A يفشل بقيد DB/trigger.
- CI يثبت تطابق كل route/method/status/schema بين registry وOpenAPI، وتساوي النسخة في metadata/package/OpenAPI.
- SDK مولد يستدعي المسار canonical، والـalias يعيد deprecation headers حتى تاريخ Sunset المعتمد.
- fault-injection: خطوة تفشل مرة ثم تنجح تعطي attempts=2، graph/task succeeded، وside effect مرة واحدة؛ استنفاد المحاولات يعطي dead وfailed متسقين.
- Playwright على build نظيف ينفذ unauth → auth → bootstrap → workspace API، ويثبت 401 عند token منتهٍ؛ لا تعتبر بطاقة PREVIEW نجاحًا.
- فشل provisioning يعرض رسالة دائمة وزر retry، ولا يعلن الجاهزية قبل status ناجح من API.

**بوابة الانتقال:** توقيع مالك المنتج على مصفوفة الأدوار وقرار alias/Sunset، وتوقيع الأمن على tenant tests، وتوقيع التشغيل على retry/timeout drill.

### المرحلة 2 — الأشهر 3–6: منصة التكامل والتشغيل القابل للاسترداد

**الأهداف**

- بناء connector path مشترك بدل خدمات SDK أو gateways موازية.
- دعم OAuth المؤسسي للتكاملات، مع أسرار قابلة للدوران دون كشف.
- تشغيل webhook ingress موثوقًا وقابلًا للتكرار والاسترداد.
- تحويل quota والمراقبة إلى قدرات موزعة قابلة للقياس.
- إثبات backup/restore وworker الدائم قبل توسيع الحمل.

**الأعمال والاعتماديات**

1. إضافة provider-neutral OAuth adapter داخل connector/credentials-vault: authorization URL، state، PKCE، callback، refresh lock، revoke، scopes، audit.
2. نقل ciphertext إلى key version/key id عبر KMS أو secret manager المعتمد، مع dual-read وtransactional re-encryption.
3. إنشاء webhook endpoint يقرأ raw body، يتحقق من signature قبل enqueue، يستخدم provider event ID، ويدرجه في inbox pending مرتبطًا بـjob queue مع status/job/error/attempt/backoff/dead.
4. نقل quota إلى Redis أو PostgreSQL atomic counter مشترك؛ keys حسب tenant/principal/route/integration، وفصل read/write/webhook/provider tiers.
5. توسيع MCP بفحص A/AAAA ومنع private/link-local وإعادة التحقق، retry bounded للقراءة الآمنة فقط، capability/health cache، وtenant/employee/approval/audit context.
6. نشر worker كخدمة دائمة مع restart policy وreplicas/heartbeat، وربط API بعنوان environment لا عنوان ثابت.
7. إضافة exporter/exception capture/alert route؛ تعيين queue age، lease، retry، dead، blocked، latency، cost metrics.
8. تعريف backup مُدار وRPO/RTO والاحتفاظ والتشفير، ثم تنفيذ restore drill على بيئة مماثلة.

**معايير القبول القابلة للقياس**

- OAuth mock: state/PKCE/issuer غير الصحيح يرفض، callback يخزن ciphertext فقط، طلبان متوازيان قرب expiry يجددان مرة واحدة، وrevoke يمنع الاتصال.
- list API لا يعيد access/refresh token أو plaintext credential.
- webhook: signature خاطئ يعيد 401، صحيح يعيد 2xx، duplicate event لا ينشئ job ثانيًا، payload مختلف بنفس ID يرفض، وفشل queue يُستعاد دون فقد.
- اختبار instanceين بمخزن quota مشترك يرفض الطلب N+1 عبرهما معًا ويعيد `429`, `Retry-After`, وheaders مستقرة؛ webhook لا يستهلك quota التصفح.
- DNS mock يعيد public ثم private/AAAA ويرفض؛ 429/5xx القراءة الآمنة تعيد retry bounded، ولا يُعاد high-risk write تلقائيًا.
- worker يثبت claim/complete، heartbeat، dead-letter recovery، وSIGTERM دون فقد أو تنفيذ مكرر.
- restore drill يسجل RPO/RTO، ثم يمرر migrations وRLS/tenant/queue tests؛ لا يمر أي release دون artifact backup/restore.
- test alert يصل إلى الوجهة المسجلة، وexception يحمل correlation دون PII.

**بوابة الانتقال:** توقيع المؤسس على مخاطر OAuth/موفري البيانات ومقدار retry، إثبات restore، وموافقة التشغيل على on-call وSLO الأولي. عند فشل التكامل الجديد: تعطيل connector/feature flag، إيقاف enqueue الجديد، إبقاء inbox لإعادة المعالجة، وعدم حذف الأسرار أو الأحداث.

### المرحلة 3 — الأشهر 6–12: التوسع المنضبط، الفوترة، والجاهزية المؤسسية

**الأهداف**

- وضع CRM/ERP/POS فوق connector/tool/approval/audit path المشترك، لا بناء مسارات خاصة.
- اتخاذ قرار فوترة قابل للتسوية، وربط entitlements بالاشتراك لا بالـusage وحده.
- تحويل evals إلى بوابة جودة AI وقياس منتج قابل لاتخاذ القرار.
- إثبات القدرة والاستعادة والإقامة والضوابط قبل أي ادعاء مؤسسي أو امتثال.
- تحسين RTL/accessibility/localization بعد ثبات المسار التشغيلي.

**الأعمال والاعتماديات**

1. بناء state machine لـcustomer/subscription/price/invoice/payment/cancel/retry، وwebhook signature/idempotency/reconciliation في sandbox أولًا.
2. ربط خطط/حدود الاستخدام بالـentitlements المقررة، مع audit ومراجع خارجية؛ عدم اعتبار `ai_employee_usage` دليل تحصيل.
3. تحويل eval cases إلى schema، DAG، approval، tenant boundary، budget، latency، retry، وtool execution fixtures مع baseline/version/threshold يمنع الترقية.
4. تنفيذ k6/Artillery أو أداة مكافئة على staging مماثل؛ قياس p95/p99، error rate، queue age، cost وconcurrency دون اختلاق SLO مسبق.
5. إعداد مصفوفة region/data residency/subprocessors/retention/deletion، وسجل أدلة لكل ادعاء امتثال، مع مراجعة مستقلة؛ لا استخدام كلمة compliant قبل اكتمال النطاق والدليل.
6. استكمال tab semantics، keyboard navigation، live regions، قاموس العربية، واختبارات 320/390px وRTL للـonboarding/workspace.
7. استخدام sunset/compatibility policy لإدارة نسخ API، وإصدار SDK/changelog دوري من المصدر نفسه.

**معايير القبول القابلة للقياس**

- كل موصل CRM/ERP/POS يمر عبر نفس credential/approval/audit/tenant context، ولا توجد خدمة SDK أو gateway موازية.
- sandbox billing يثبت create/update/cancel/retry/idempotent webhook وno double charge، وreconciliation يطابق المرجع الخارجي مع entitlement.
- golden suite تفشل خطة بنفس actions لكن dependency/input/approval خاطئ، ولا تمر الترقية دون threshold مؤرخ وموقع.
- load/soak report يذكر p95/p99/error/queue-age/cost والحدود المقاسة، مع قرار واضح: اجتياز/فشل/عدم كفاية العينة.
- كل ادعاء residency أو امتثال له نطاق ودليل ونسخة ومراجع؛ ما لا يملك ذلك يبقى “غير مثبت”.
- اختبار الوصول يثبت علاقات tab/panel، focus/Arrow/Home/End، live status/error، وعدم overflow في المقاسات المحددة.

**بوابة الانتقال:** قرار مؤسس منفصل لكل فوترة، موصل إنتاجي، منطقة بيانات، أو ادعاء امتثال. إذا فشل load أو billing reconciliation، يبقى المنتج في وضع تجريبي/يدوي ولا يُعلن جاهزًا مؤسسيًا.

## 5. المسار المرجعي للهوية والمؤسسة والمساحات

المسار المقترح التالي هو **مرجع تصميم مستقبلي مشروط**، وليس وصفًا لما هو منشور اليوم:

1. **المصادقة:** Supabase Auth/IdP adapter هو مصدر الهوية الوحيد؛ token يتحقق من issuer/audience/expiry، ولا يعتمد runtime على `auth.js` المحلي القديم.
2. **هوية خارجية اختيارية:** لكل organization إعداد IdP مع metadata/certificate أو OIDC discovery، domains، group-to-role mapping، state/nonce/audience checks. لا JIT ينشئ مؤسسة غير محكومة.
3. **المؤسسة:** `organization` هي حد المستأجر الأعلى؛ كل مستخدم يربط بـ`auth_user_id` وexternal subject immutable، ولا يتغير `organization_id` من مسار عميل.
4. **المساحة:** `workspace` تابعة لمؤسسة واحدة. كل مورد تشغيلي يحمل `workspace_id`، وتفرض DB العلاقات المركبة مع الموارد التابعة.
5. **العضوية:** `workspace_members` مصدر عضوية المساحة، وتُدار server-side فقط. إنشاء/دعوة/تغيير/إلغاء الدور يحتاج actor مخولًا، audit، وسياسة revoke للجلسات عند الإلغاء.
6. **الصلاحية:** القرار = principal + organization/workspace context + role + capability + action + resource + state. لا يكفي role في كائن العميل أو غياب زر في الواجهة.
7. **التنفيذ:** كل task/tool/approval يحمل tenant context وattempt/lease/idempotency، وكل قرار حساس يترك audit event.
8. **البيانات:** RLS هو defense-in-depth لا بديل عن API policy، والـAPI لا يفترض أن Data API غير قابل للوصول.

## 6. الأمن والحوكمة

- **بوابة تغيير:** أي تغيير في RLS، grants، roles، membership، IdP، secrets، billing، أو data residency يحتاج قرارًا موثقًا من المؤسس ومالكًا تقنيًا واختبار rollback.
- **فصل الصلاحيات:** لا يجمع actor الواحد تلقائيًا إدارة العضويات والموافقات والتكاملات والفوترة؛ المصفوفة هي المرجع.
- **إدارة الأسرار:** لا tokens في metadata أو client bundle أو logs؛ key id/version، dual-read أثناء الدوران، revoke، واختبار فقد المفتاح.
- **سجل التدقيق:** membership/role mapping/provisioning/deprovisioning/approval/tool call/credential/billing/security decision، مع tenant context وactor وrequest/correlation id.
- **اختبارات قاعدة حية:** gate مستقل يرفض التخطي الصامت عند غياب `DATABASE_URL`. نتائج contract لا تغلق فجوة RLS.
- **الخصوصية:** قبل أي التزام يجب تحديد retention/deletion/residency/subprocessors، ومراجعة PII في logs/telemetry؛ لا يوجد في نتائج التدقيق دليل امتثال حالي.

## 7. التكاملات وAPI

المبدأ: **عقد واحد، connector واحد، approval/audit واحد**.

- مصدر العقد إما route registry يولّد OpenAPI أو OpenAPI يولّد registry؛ لا تبقى ثلاث نسخ للرقم أو مسارات ناقصة.
- namespace canonical واحد لـ`integrations` أو `connections` بقرار مؤسس/منتجي، والآخر alias زمني مع deprecation/sunset.
- SDK TypeScript/JavaScript مولد من العقد، لا SDK موازي يحوي منطقًا مختلفًا.
- quota في مخزن موزع، مع فصل interactive API وwebhook وoutbound provider وMCP.
- OAuth يتعامل مع state/PKCE/refresh/revoke/scope، وAPI key/MCP token يمران من نفس interface الآمن.
- webhook ingress raw-body/signed/inbox/idempotent/retryable/dead؛ لا enqueue قبل التحقق والتسجيل القابل للاسترداد.
- MCP لا يتجاوز tenant/employee/approval/audit، ولا يعاد high-risk write تلقائيًا عند transient failure.

## 8. UX والتهيئة وإمكانية الوصول

- فصل public landing بوضوح عن authenticated route؛ CTA يجب أن يبدأ signup/login أو contact flow حقيقيًا، لا hash داخل الصفحة فقط.
- onboarding عقدة حالة: `not_started → bootstrapping → provisioning → ready` أو `failed_retryable`. لا تُعلن authenticated/ready بسبب reload.
- كل فشل provisioning يعرض سببًا مفهومًا، retry idempotent، وrequest id عند توفره؛ لا يعتمد على `sessionStorage` بلا مستهلك.
- الواجهة العربية RTL افتراضيًا، والنصوص من مصدر ترجمة واحد؛ brand/technical exceptions موثقة.
- tabs تتبع نمط WAI-ARIA كاملًا: ids، `aria-controls`, `aria-labelledby`, focus order، Arrow/Home/End.
- provisioning status ثابت كـ`role=status aria-live=polite`; الخطأ `role=alert` مع focus قابل للوصول.
- اختبارات build نظيف وPlaywright تغطي 401، انتهاء الجلسة، 5xx provisioning، retry، وبيانات API الفعلية؛ لا تعتبر Preview دليل نجاح.

## 9. التشغيل والامتثال

- **النشر:** API وweb وworker وmigrations بوابة واحدة؛ لا نشر API دون worker وmigration status قابلين للتحقق.
- **الاستعادة:** backup مشفر، retention/RPO/RTO معتمدة، restore drill دوري يعيد تشغيل tenant/RLS/queue tests.
- **المراقبة:** exporter فعلي، Sentry capture من entrypoint، queue age/lease/retry/dead/blocked/latency/cost، وتنبيهات تصل إلى وجهة مسجلة مع on-call.
- **الفشل:** runbook لـworker crash، stale lease، dead-letter، provider outage، migration failure، credential revoke، وcross-tenant incident.
- **الأداء:** لا رقم أداء مفترض؛ تُقاس القدرة على staging مماثل وتُحفظ نتائج p95/p99/error/concurrency/cost. لا يتحول القياس إلى SLO إلا بقرار مؤسس/تشغيلي.
- **الامتثال:** لا تُستخدم GDPR/SOC2/HIPAA/PCI أو “enterprise compliant” بلا نطاق ودليل ومراجعة مستقلة. نتائج التدقيق الحالية لا تثبت أي اعتماد.

## 10. القياس والمنتج

### لوحة قياس الحد الأدنى بعد تأسيس الأدلة

| المحور | المقاييس التي ينبغي جمعها | شرط الاستخدام |
|---|---|---|
| الحدود والأمن | cross-tenant deny rate، محاولات privilege escalation المرفوضة، audit completeness، RLS test status | لا تُعرض كنسبة أمان إنتاجية قبل قاعدة فعلية واختبار دوري |
| التنفيذ | queue age، blocked، retry، dead، lease expiry، attempts، side-effect idempotency | يجب ربطها بـjob/task/tenant دون PII زائد |
| التكاملات | OAuth refresh success، webhook duplicate/recovery، provider error، quota 429، MCP timeout/retry | يميز interactive عن outbound ولا يخلط نجاح HTTP بنجاح business |
| AI | plan pass rate، schema/DAG/approval failures، latency، cost، provider، regression baseline | لا تمر ترقية model/provider دون threshold موقع |
| المنتج | signup/login completion، bootstrap/provisioning success، retry success، workspace activation | لا تستخدم أرقامًا حالية؛ build الحالي لا يثبت المسار |
| التشغيل | heartbeat staleness، restore drill RPO/RTO، deploy/migration smoke، alert delivery | الدليل هو run artifact لا تعريف metric فقط |
| الفوترة | subscription/payment/invoice reconciliation، entitlement transitions، duplicate charge checks | لا يعتبر usage الداخلي تحصيلًا |

### بوابة قرار المنتج

كل ميزة جديدة تمر بالأسئلة التالية قبل التنفيذ:

1. هل تستخدم tenant context وpolicy engine وaudit؟
2. هل لها schema/idempotency/retry/timeout محددة؟
3. هل تحتاج approval أو صلاحية جديدة يقرها المؤسس؟
4. هل تضيف provider secret أو data residency/retention أثرًا؟
5. هل يمكن تعطيلها feature flag وإعادة معالجة آثارها؟
6. هل معيار القبول قابل للتشغيل على قاعدة/worker فعلي، لا نص/regex فقط؟

## 11. المخاطر وخطة الاحتواء والتراجع

| الخطر | الإشارة المبكرة | الاحتواء | التراجع الآمن |
|---|---|---|---|
| كسر وصول مشروع بعد RLS | ارتفاع 401/403 أو فشل role-by-action | تفعيل تدريجي لمساحة اختبار/feature flag، دعم admin break-glass مضبوط ومُدقق | migration تصحيحي أو policy أضيق/أوضح؛ لا تعطيل RLS كحل سريع |
| امتياز عضوية غير مشروع | تغيير role غير متوقع أو audit ناقص | إيقاف endpoint العضوية، revoke sessions، فحص memberships | استرجاع العضويات من backup موثوق بعد قرار مؤسس، لا تعديل مباشر غير مدقق |
| migration غير قابلة للرجوع | فشل smoke أو mismatch schema | backup/compatibility check قبل deploy، وقف traffic الكتابي | restore drill/forward-fix مع الحفاظ على audit؛ لا down migration عشوائي |
| worker بلا مستهلك | queue age/heartbeat stale/dead يرتفع | إيقاف قبول المهام الجديدة، تشغيل replica معتمد، إبقاء jobs قابلة للاسترداد | إعادة نشر worker آخر نسخة مع التحقق من lease/idempotency |
| retry يكرر side effect | attempts أو provider calls تتجاوز المتوقع | تعطيل retry عالي المخاطر، reconciliation يدوي، idempotency key | إيقاف feature flag وإعادة تسوية النتائج؛ لا replay أعمى |
| OAuth/موفر خارجي معطل | refresh errors أو 429/5xx | إيقاف connector، عدم حذف tokens، رسالة واضحة للمستخدم | العودة إلى read-only/API key فقط إن أقر المؤسس، أو إعادة التفويض |
| webhook فقد/duplicate | inbox pending/dead أو event ID متعارض | وقف downstream execution، replay من inbox، رفض payload المتغير | إعادة المعالجة idempotently بعد إصلاح queue؛ لا حذف event history |
| فشل provisioning | ready/ authenticated بلا resource counts | إبقاء الحالة failed_retryable، منع ادعاء الجاهزية، retry محدود | resume من bootstrap أو تعويض الموارد الجزئية |
| تسرب سر/PII | secret في log/response أو alert | revoke/rotate، حصر السجلات، incident review | استعادة key version السابقة فقط بعد تقييم الأثر؛ لا إخفاء الحدث |
| فشل load/restore/امتثال | SLO غير مقاس أو drill غير قابل للإعادة | إبقاء النطاق تجريبيًا، تقليل concurrency، تأجيل claim | العودة لآخر بيئة مثبتة؛ لا إعلان enterprise readiness |

## 12. ما لا يمكن تأكيده قبل فحص بيئة الإنتاج

لا يمكن من نتائج التدقيق وحدها تأكيد أي مما يلي:

- حالة `relrowsecurity` والمنح والسياسات الفعلية في Supabase/PostgREST، أو أن كل الهجرات المفحوصة هي سلسلة النشر نفسها وبالترتيب نفسه.
- وجود/غياب إعدادات SSO/SAML/OIDC/SCIM أو secrets أو CORS أو إعدادات Dashboard خارج المستودع.
- عزل tenant في قاعدة منشورة، أو سلامة بيانات الإنتاج، أو وجود privilege escalation فعليًا؛ الملاحظات مبنية على المصدر واختبارات لم تُشغّل حيًا.
- عدد instances، وجود Redis/managed gateway، حدود الشبكة، trusted proxy، أو قدرة rate limit الحالية.
- تشغيل worker دائم، job consumer، migrations، backup، restore، alert exporter، Sentry، Vercel/Supabase/Edge Functions، أو أي topology إنتاجية.
- أي مزود OAuth/CRM/ERP/POS أو عقد webhook/MCP حقيقي أو SLA/provider behavior.
- RPO/RTO، p95/p99، throughput، cost، concurrency، uptime، أو أي SLO؛ لم تُجر load/soak/restore/chaos drills.
- منطقة تخزين البيانات، retention/deletion، subprocessors، أو GDPR/SOC2/HIPAA/PCI evidence/شهادة.
- اكتمال الفوترة والتحصيل، checkout، payment، invoice، reconciliation، أو entitlement خارجي.
- أن signup/login/onboarding/workspace متاح في build المنشور؛ المتاح المثبت هو Landing/Preview عامة.
- أن مقارنة Salesforce تمثل parity أو توقعًا تجاريًا؛ هي اتجاه طموح فقط حتى يحدد إنجاز نطاقه وميزاته وأدلته.

## 13. القرارات التي تتطلب اعتماد المؤسس

الخطوات الآتية تغيّر سياسة المنتج أو المخاطر أو التزامات العملاء، فلا تُنفذ ضمنيًا:

1. اعتماد hierarchy المؤسسة والمساحات، وصاحب السلطة النهائية على membership والـrole.
2. اعتماد مصفوفة الأدوار والقدرات، خصوصًا فصل owner/org_admin/workspace_admin/operator/approver/viewer.
3. قرار IdP/SSO: مزود الهوية، domains، mapping، JIT، SCIM، وسياسة تعطيل المستخدم وسحب الجلسات.
4. اختيار namespace canonical وversioning/Sunset للـAPI، والجمهور المستهدف للـSDK.
5. قرار مستوى أتمتة الموافقات، وما الذي يجوز retry له أو يحتاج تدخلًا يدويًا.
6. قرار موفري OAuth وCRM/ERP/POS الأوائل، ونطاق الأسرار والبيانات المسموح إرسالها لكل موفر.
7. اعتماد RPO/RTO والاحتفاظ والنسخ الاحتياطي ومناطق البيانات.
8. اعتماد نموذج الفوترة: هل هي داخل المنتج أم عبر مزود خارجي، وما entitlements التي توقف الخدمة.
9. اعتماد SLOs بعد قياس فعلي، وعدد replicas/نموذج on-call وتكلفة التشغيل.
10. تحديد أي ادعاء سوقي أو “enterprise/compliant” يمكن نشره، وعلى أي دليل ونطاق ومراجعة.
11. اعتماد تعريف النجاح المنتجّي لـonboarding/workspace قبل توسيع واجهة الـLanding.

## 14. الأسئلة الحاسمة المفتوحة

1. ما هي قاعدة Supabase/البيئة التي تمثل النشر الحالي، وهل يمكن تشغيل اختبارات RLS والـtenant boundary عليها أو على نسخة مطابقة؟
2. هل `services/api/db/migrations` و`supabase/migrations` سلسلة واحدة للنشر، وما migration marker الفعلي في كل بيئة؟
3. من هو owner/admin الرسمي للمؤسسة؟ وهل `manager` دور مساحة أم دور مؤسسي؟
4. هل المطلوب SSO/SCIM في النطاق القريب؟ وما IdP الأول، وسياسة JIT والدعوات والنطاقات؟
5. ما المسار canonical بين `integrations` و`connections`؟ وما تاريخ Sunset المقبول للعملاء الحاليين؟
6. ما provider الأول لـOAuth، وما scopes/بياناته المحظورة؟
7. ما الذي يعد side effect عالي المخاطر ولا يجوز له retry تلقائيًا؟
8. ما الحد الأدنى المقبول لـRPO/RTO، وما ميزانية تشغيل Redis/worker/backup/on-call؟
9. هل ستُبنى الفوترة داخليًا أم عبر مزود خارجي؟ وما مصدر الحقيقة للـsubscription/entitlement؟
10. ما المناطق الجغرافية وسياسة الاحتفاظ والحذف المطلوبة؟ وهل توجد متطلبات تعاقدية أو تنظيمية لم تُذكر في التدقيق؟
11. ما تعريف activation المنتج: signup فقط، أم workspace جاهز، أم أول task/approval مكتمل؟
12. ما نطاق المقارنة الطموحة مع Salesforce، وما الذي **لا** يعد وعد تكافؤ؟
13. من يملك قرار قبول كل بوابة: المؤسس، الأمن، التشغيل، المنتج، أم مالك بيانات مستقل؟
14. ما البيئة التي يمكن استخدامها لاختبار load/restore/provider end-to-end دون لمس بيانات إنتاجية؟

## 15. قاعدة الإغلاق والتوثيق

لكل فجوة مغلقة يجب حفظ: رقم/نسخة migration أو commit، مالك، قرار مؤسس إن لزم، وصف بيئة الاختبار، أمر التشغيل، نتيجة pass/fail، artifact (logs/report/screenshot عند الحاجة)، أثر rollback، وتاريخ المراجعة. إذا تعذر تشغيل اختبار بسبب غياب خدمة أو متغير بيئة، تسجل الحالة **غير مثبتة** ولا تتحول إلى “ناجحة” بالاعتماد على تحليل الشيفرة.

**الخلاصة التنفيذية:** إنجاز يمكن أن يتحول إلى منصة مؤسسية، لكن نقطة الانطلاق الواقعية هي تثبيت الحدود والسياسات والاتساق التشغيلي وإثبات النشر، لا توسيع الواجهة أو ادعاء التكافؤ مع Salesforce. كل مرحلة لاحقة مشروطة بدليل قابل للتشغيل وبقرار مؤسس عندما يتغير نطاق السلطة أو المخاطر أو التزام المنتج.
