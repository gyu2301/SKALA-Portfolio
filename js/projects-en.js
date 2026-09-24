// 프로젝트 영어 번역 저장소
// projects.js의 프로젝트 id를 키로 사용합니다.
// 새 프로젝트를 추가하면 같은 id로 영어 번역도 함께 추가하면 됩니다.
// (번역이 없는 항목은 한국어 원문이 그대로 표시됩니다.)
// linkLabels는 projects.js의 links 순서와 같은 순서로 적습니다.

window.projectsEn = {
  "prompt-design": {
    title: "Prompt Design & Context Engineering",

    description:
      "A project that applies prompt engineering and context design to improve the quality and token efficiency of LLM outputs.",

    linkLabels: [
      "Final LLM Responses — Team 2 (PDF, Korean)",
      "Prompt Design & Context Report (PDF, Korean)"
    ],

    overview: `
      This project analyzes the reverse cross-border e-commerce of K-beauty products, where items exported to markets such as the U.S. and Southeast Asia flow back into Korea, and the risks this creates for brands. I analyzed the weaknesses of an LLM's initial answer and then applied prompt engineering to produce a detailed strategy report that executives could actually use.
    `,

    process: [
      "Wrote a baseline prompt asking about K-beauty reverse cross-border trends and analyzed the weaknesses of the response, including misdefined concepts, hallucinations, and poor structure.",
      "Because the responses became too long, narrowed the scope to the U.S. and Southeast Asia and to skincare and color cosmetics, which improved both token efficiency and accuracy.",
      "Designed an improved prompt with a detailed Role (consultant), Objective, Context, Constraints (no vague wording, evidence required), Required Analysis, and Output Format."
    ],

    result: `
      With a clearly structured prompt, the model moved beyond generic lists and identified three core business risks: price inversion between domestic and overseas retail prices, conflicts with official distribution channels, and the re-entry of discounted inventory and overseas products. It also produced a phased 30/90/180-day action roadmap, including a global pricing governance framework and a monitoring system.
    `,

    learned: `
      I confirmed that a simple prompt can lead an LLM to misunderstand the target of the analysis or generate unsupported claims (hallucinations). I learned that narrowing the scope, assigning a role, and specifying detailed constraints and an output outline makes it possible to get a structured, reliable consulting-style report.
    `
  },

  "boston-housing": {
    title: "Boston Housing Price Regression Analysis",

    description:
      "Analyzed the distribution and drivers of median home values in the Boston Housing dataset, then evaluated predictive performance with hypothesis tests and regression models.",

    overview: `
      Using the Boston Housing dataset, I explored the factors that influence median home value (medv). After checking the data structure, missing values, outliers, and correlations, I tested whether proximity to the Charles River makes a significant difference in home prices, and used multiple regression to identify key drivers.
    `,

    process: [
      "Checked the number of rows and columns, data types, and missing values, and screened numeric variables for outliers using the IQR rule.",
      "Used Welch's independent-samples t-test to check whether mean home value differs by proximity to the Charles River.",
      "Ran correlation analysis and OLS regression to find the variables that affect home prices, then rebuilt the model after removing variables with high p-values.",
      "Split the data into training and test sets, trained a LinearRegression model, and evaluated it with R², MAE, MSE, and RMSE."
    ],

    result: `
      The difference in home prices by Charles River proximity was statistically significant. In the regression, zn, chas, rm, rad, and b were positively associated with median home value, while crim, nox, dis, tax, ptratio, and lstat were negatively associated. I evaluated the model's explanatory power and error metrics on the test set.
    `,

    learned: `
      I learned that hypothesis testing and regression are suited to different questions. I also learned how much variable selection and interpretation matter, the difference between correlation and causation, and why several evaluation metrics should be read together when interpreting a model.
    `
  },

  "Transformer-Architecture": {
    title: "Mini Transformer Language Model from Scratch",

    description:
      "Built a Transformer-based mini GPT trained at the character level on eight Korean short stories by Kim Yu-jeong, and analyzed its contextual learning and limitations through training loss and generated text.",

    linkLabels: ["Report (PDF, Korean)"],

    overview: `
      I tokenized eight short stories by Kim Yu-jeong (97,708 characters, a vocabulary of 1,271 characters) at the character level and implemented a Transformer-based mini language model. Using a stack of six Transformer blocks with token and position embeddings, multi-head self-attention, a causal mask, residual connections, and an MLP, I built a model that predicts the next character.
    `,

    process: [
      "Performed character-level tokenization and built the input vectors by adding token embeddings and position embeddings.",
      "Implemented self-attention Q/K/V, a causal mask, multi-head attention, residual connections, a feed-forward MLP, and a language model head to build the next-character prediction model.",
      "Trained for 2,000 iterations on a Google Colab GPU, tracked the training loss, and compared the quality of generated text before and after training.",
      "Evaluated text generated with temperature=1.0 and top_k=10 sampling to see how well the model learned character patterns and Korean sentence structure."
    ],

    result: `
      Early in training the output was mostly random characters, but after about 500 iterations punctuation and real words started to appear, and after 1,000 iterations dialogue and narrative forms became clearer. The final output partly reproduced Korean sentence forms but still struggled with word combinations and semantic coherence, showing that the model had learned contextual patterns but had limited understanding of overall meaning.
    `,

    learned: `
      I learned that a Transformer language model does not store and retrieve complete sentences. Instead, it generates text by predicting the next character from the current context. I also saw that lower loss does not guarantee natural meaning or generalization, and that while a mini model is a good way to learn the core principles, it cannot replace the scale of parameters and data or the instruction tuning and alignment of real LLMs.
    `
  },

  "car-list-crud": {
    title: "Used Car Listing CRUD App",

    description:
      "A CRUD web app with an HTML form and buttons for create, edit, delete, search, and filter, a responsive CSS Grid layout with status badges, and all interactions built using only JavaScript event delegation and DOM manipulation.",

    overview: `
      I structured the input form, search area, and card-style list in HTML, and used CSS Grid and media queries to build a responsive two-column/one-column layout with color-coded sale-status badges. The Create, Edit, and Delete buttons and the search and filter inputs are wired up with JavaScript event delegation and DOM manipulation, so every CRUD feature runs in the browser with no framework or server.
    `,

    process: [
      "Built the HTML from a form area, a search area, and a card list, created a two-column layout with CSS Grid that switches to one column on narrow screens via media queries, and styled color-coded status badges (status-badge).",
      "Implemented the Create feature on the form's submit event: the make, model, year, mileage, price, and fuel inputs are validated before the car object is added to the array, with an alert and focus moved to each invalid field.",
      "Instead of attaching listeners to the Edit and Delete buttons on every newly rendered card, applied event delegation on the list container and used data-action and data-id attributes to identify which button on which car was clicked.",
      "The Edit button fills the form with existing values and switches the submit button to 'Save changes'; Delete removes the car after a confirm dialog; and the list re-renders whenever the search text or status filter changes.",
      "Handled missing or broken car images by listening for the img error event and automatically replacing them with an 'image coming soon' placeholder."
    ],

    result: `
      Creating, reading, updating, and deleting cars all work correctly, and the list updates properly even when make/model search and sale-status filters are combined. I also confirmed that the input and list areas sit side by side on wide screens and automatically switch to a single column on narrow screens.
    `,

    learned: `
      I learned the pattern of managing state in an array and re-rendering the UI from that state. I also learned that sharing one form and one validation routine between create and edit reduces duplicated code, and that data attributes plus event delegation make it easy to control buttons on dynamically created cards.
    `
  },

  "academic-management-system": {
    title: "Academic Management System: Database Design & Implementation",

    description:
      "Designed an ERD for an academic management system covering departments, professors, students, courses, and enrollments, then implemented it in PostgreSQL, from constraint-aware DDL through data loading and a wide range of SELECT queries.",

    linkLabels: ["Academic Management System Report (PDF, Korean)"],

    overview: `
      This project designs and implements an academic management system that manages a university's departments, professors, students, courses, and enrollments in a single database. I defined the 1:N and M:N relationships between entities, designed an ERD that enforces data integrity through PK, FK, CHECK, UNIQUE, and DEFAULT constraints, and implemented it in PostgreSQL with DDL and DML.
    `,

    process: [
      "Defined requirements for five entities (department, professor, student, course, enrollment) and designed an ERD reflecting department–professor/student 1:N, professor–course 1:N, professor–student (advisor) 1:N, and student–course M:N relationships.",
      "Wrote CREATE TABLE DDL with SERIAL primary keys, foreign keys, NOT NULL, CHECK (gender M/F, credits 1–3, grade values), UNIQUE (department name, no duplicate enrollments), and DEFAULT (CURRENT_DATE) constraints.",
      "Inserted 10 departments, 10+ professors, students, and courses each, and 16 enrollments, then ran basic queries using WHERE and ORDER BY.",
      "Used COALESCE to display a fallback for missing contact info, CASE WHEN to convert scores into grade bands, and AGE and DATE_PART to calculate age and years of enrollment.",
      "Wrote multi-table JOIN queries linking students, courses, professors, and departments, and GROUP BY queries counting enrollment per course, to verify the enrollment junction table."
    ],

    result: `
      I confirmed that all constraints across the five tables work correctly in PostgreSQL (preventing duplicate department names and duplicate enrollments, and restricting gender, credit, and grade values). Multi-table JOINs and GROUP BY aggregation accurately returned each student's enrollment history and the number of students per course.
    `,

    learned: `
      I learned that M:N relationships in a relational database must be broken down with a junction table, and that constraints such as PK, FK, CHECK, UNIQUE, and DEFAULT must be defined carefully from the design stage to protect data integrity. Applying COALESCE, CASE WHEN, date functions, multi-table JOINs, and GROUP BY to real data also gave me practical experience turning requirements into SQL.
    `
  },

  "campushub-advanced-sql": {
    title: "CampusHub Advanced SQL Analysis",

    description:
      "Solved 25 advanced SQL problems in pgAdmin 4, using multi-table JOINs, subqueries, set operations, recursive CTEs, and window functions on the CampusHub academic schema from the previous project and a company org-chart dataset.",

    linkLabels: ["CampusHub Advanced SQL Report (PDF, Korean)"],

    overview: `
      Building on the CampusHub schema (departments, professors, students, courses, enrollments) from the previous project and a company org chart (emp-manager), I wrote and verified 25 SQL problems in pgAdmin 4, ranging from INNER, OUTER, SELF, and CROSS JOINs to correlated subqueries, set operations, ROLLUP aggregation, recursive CTEs, and window functions.
    `,

    process: [
      "Started by finding an off-by-one error in the data-loading script where manager_id was mismapped for emp_id 12–311, fixed it with an UPDATE, and re-verified the number of direct reports per manager.",
      "Queried student, course, and org data from multiple angles using INNER, LEFT, RIGHT, and FULL OUTER JOINs, SELF and CROSS JOINs, and anti-/semi-join patterns with NOT EXISTS and EXISTS.",
      "Aggregated each student's course list with COALESCE, TO_CHAR currency formatting, and STRING_AGG, and built a new course_owner mapping table that assigns five courses to managers in rotation using ROW_NUMBER().",
      "Wrote scalar, non-correlated, and correlated subqueries, WITH CTEs, UNION ALL set operations, and a report with subtotals and grand totals by major and GPA band using ROLLUP and GROUPING.",
      "Implemented a recursive org-chart query with WITH RECURSIVE that computes depth and path, and implemented per-group Top-N with ROW_NUMBER, RANK, DENSE_RANK, and COUNT OVER (PARTITION BY) in both subquery and CTE styles.",
      "Finished by scoring each student's letter grades (A–D) and analyzing trends with LAG(), and computing moving sums, moving averages, and cumulative ratios with SUM() and AVG() OVER (ROWS BETWEEN ... PRECEDING)."
    ],

    result: `
      All 25 queries ran in pgAdmin 4 and returned the intended results. The org tree for 11 managers was traversed recursively up to depth 10, ROLLUP correctly produced subtotals by major and GPA band (under 3.0, 3.0–3.5, over 3.5) plus a grand total, and window functions verified each student's grade trend and cumulative ratios.
    `,

    learned: `
      I learned that problems that plain JOINs cannot solve call for advanced techniques such as correlated subqueries, recursive CTEs, and window functions. Solving the same Top-N problem with both subqueries and CTEs let me compare their trade-offs in readability and performance. Seeing how a small off-by-one error at load time could distort every downstream aggregate also showed me how important it is to validate data before analysis.
    `
  },

  "hr-slow-query-tuning": {
    title: "HR Database Slow Query Tuning: EXPLAIN Before/After",

    description:
      "Diagnosed slow search queries in an HR database of 50,000 employees with EXPLAIN (ANALYZE, BUFFERS), tuned them with function-based, partial, and composite indexes and query rewrites, and compared the before/after execution plans.",

    linkLabels: ["HR DB Slow Query Tuning Report (PDF, Korean)"],

    overview: `
      Assuming an HR system where searches and report generation had slowed down as headcount grew past 50,000, I diagnosed four types of slow queries (email lookup, LIKE suffix search, sort + filter, and OR conditions) with EXPLAIN (ANALYZE, BUFFERS), tuned them with index design and query rewrites, and compared the before/after execution plans along with buffer and execution time metrics.
    `,

    process: [
      "Used execution plans to show why lower(email), upper(email), and ILIKE comparisons could not use an index and fell back to a Seq Scan over 50,000 rows, then tuned step by step: a function-based index (idx_employees_lower_email), a sargable rewrite that removed the function because the column was already lowercase, and an INCLUDE covering index that enabled an Index Only Scan.",
      "Compared LIKE with a leading wildcard such as '%gmail.com' against right() and split_part() suffix extraction, and analyzed the reusability, index size, and performance trade-offs of a reverse() index with text_pattern_ops, a right() index, and a split_part() index.",
      "For a query returning the top 100 salaries among active employees hired in the last 365 days, found that the bottleneck was the Sort (top-N heapsort / external merge) rather than the lookup, removed the Sort node with an equality-first composite index and a status='ACTIVE' partial index sorted by salary DESC, and rewrote the query with WITH ... AS MATERIALIZED to narrow to 100 rows before joining.",
      "For department_id=10 OR job_id IN (3,4,5), showed how OR lists and implicit type casts (::text) disable indexes, tested per-column indexes with BitmapOr and UNION/UNION ALL rewrites (checking for double counting), and enabled an Index Only Scan by removing the cast and adding an INCLUDE covering index.",
      "Tabulated Execution Time, Buffers, Heap Blocks, Rows Removed by Filter, and Sort Method from each before/after EXPLAIN, and explained why faster execution does not always mean fewer buffers, in terms of row density per block (about 63 rows/block) and selectivity."
    ],

    result: `
      Matching the condition to the index made exact-match email search 29.6–320x faster, early termination with ORDER BY + LIMIT made the top-N query 103.5x faster, and narrowing to 100 rows before the join made it 40.5x faster. For the LIKE suffix and OR condition tuning, execution time dropped but Buffers sometimes rose by 1–8% because the target rows were spread across many blocks. This let me separate cases where the gain came from lower CPU cost for per-row functions and casts from cases where the scan range (Heap Blocks) actually shrank.
    `,

    learned: `
      I learned that good query tuning is not about adding more indexes. It means writing sargable conditions without functions or casts on columns, placing selective equality conditions first in composite indexes, and reducing the number of rows processed with partial indexes, LIMIT-based early termination, and filtering before joins. I also learned that Buffers do not always track tuning gains: when selectivity is low, an index may not reduce the heap blocks read. Execution Time, Buffers, Heap Blocks, Rows Removed, and Sort Method must be read together to tell whether an improvement came from less I/O or less CPU work.
    `
  },

  "ecommerce-sales-analysis": {
    title: "E-Commerce Sales Analysis & Query Performance Tuning",

    description:
      "Wrote 11 analytical queries (net revenue, categories, RFM, repurchase rate, and more) on a PostgreSQL e-commerce schema, diagnosed bottlenecks with EXPLAIN (ANALYZE, BUFFERS), tuned them with rewrites and indexes, and sped up the daily sales report with a materialized view.",

    linkLabels: ["E-Commerce Sales Analysis Report (PDF, Korean)"],

    overview: `
      A PostgreSQL e-commerce sales analysis project. Net revenue is defined as qty * unit_price - discount, excluding unpaid, canceled, and refunded orders. On that basis I wrote 11 analytical queries: last-month revenue, monthly orders and AOV, top 10 categories, cumulative product revenue ranking, customer RFM, repurchase rate, low-stock alerts, top-rated products, coupon impact, and revenue from the top 1% of customers. I then compared execution plans with EXPLAIN (ANALYZE, BUFFERS), rewrote and indexed the bottleneck queries, and precomputed the frequently used daily sales report as a materialized view.
    `,

    process: [
      "Defined the analysis reference time as the earlier of the current time and the latest valid order time, which avoids problems from future timestamps in the seed data and from empty windows when looking at the past, and standardized every period filter to (reference − period, reference].",
      "Built full category paths with a recursive CTE to find the top 10 leaf categories by revenue over the last 90 days, ranked the top 20 products by cumulative revenue with RANK() (ties included), and calculated RFM and 30-day repurchase rates using only customers with a complete observation window as the denominator.",
      "Queried low-stock products, best sellers with 4.5+ ratings and 50+ reviews using HAVING, average order value with vs. without coupons, and 60-day revenue from the top 1% of customers selected with ROW_NUMBER and CEIL(customers * 1%), and created an ecom.safe_divide() function that returns NULL on division by zero for safe AOV calculations.",
      "Ran EXPLAIN (ANALYZE, BUFFERS) on all 11 queries to compare execution time, buffers, and scan types. Rewrote Q6's per-customer EXISTS subquery with a partial index, window functions, and BOOL_OR, and rewrote Q3, which scanned order_items repeatedly, with a MATERIALIZED CTE and a covering index, cutting them from 189.757 ms to 8.909 ms and from 15.434 ms to 12.879 ms.",
      "Compared how Hash Join, Nested Loop, and Bitmap Heap Scan work and when each fits, and designed the mv_daily_gmv materialized view to precompute daily revenue for paid orders and avoid repeated large joins and aggregations.",
      "Added a unique index on the day column so REFRESH ... CONCURRENTLY does not block reads, scheduled a daily 3 PM refresh with pg_cron, and compared the optimizers, join strategies, and precomputation features of PostgreSQL, MySQL, Oracle, and SQL Server."
    ],

    result: `
      All 11 queries returned the intended results. Tabulating execution time, shared hits, and shared reads from EXPLAIN showed that Q6 (repurchase rate) ran over 95% faster and Q3 (top 10 categories) used far fewer buffers. With the mv_daily_gmv materialized view, the daily sales report reads only the stored day and gmv values instead of re-joining and summing the source tables, so it returns instantly.
    `,

    learned: `
      I learned that fixing the definition of net revenue (order status and discounts) and the analysis reference time early in a project keeps every later query's period filters and aggregates consistent. I also learned that neither Hash Join nor Nested Loop is always better, and that for workloads that repeatedly run the same complex join, precomputing with a materialized view, which removes the join and aggregation cost entirely, is a more effective optimization than re-joining the source tables every time.
    `
  },

  "vue-weather-dashboard": {
    title: "Vue 3 Weather Dashboard",

    description:
      "A real-time weather dashboard built with Vue 3 Composition API, Pinia, Vue Router, and Element Plus, featuring OpenWeatherMap integration, city search/add/remove, a live wind globe, air quality and city info cards, and time-of-day outfit recommendations.",

    overview: `
      A weather dashboard built with the Vue 3 Composition API, Vite, and Element Plus. It fetches real-time weather for multiple cities from the OpenWeatherMap API and brings together city search, adding, and removing, Celsius/Fahrenheit switching, a live wind globe, 24-hour temperature and precipitation charts, air quality and city info cards, and outfit recommendations by time of day in a single app.
    `,

    process: [
      "Fetched weather for multiple cities in parallel with Promise.all in a Pinia weatherStore and rendered them as dashboard cards, using isLoading and errorMessage state to distinguish loading from API errors such as 401 and 429.",
      "Worked around the OpenWeatherMap Geocoding API's lack of partial-match search with a two-step search that checks a custom CITY_DIRECTORY first and falls back to Geocoding. Fixed a bug where Korean IME composition caused a duplicate Enter emit and added a card twice, using an event.isComposing guard and reusing the in-flight search promise.",
      "Unified the search, feedback, and status UI with Element Plus components (ElInput, ElCard, ElAlert, ElTag, ElProgress), and added an EarthWindGlobe that embeds earth.nullschool.net's live wind map in an iframe. Since a cross-origin iframe does not receive wheel or pinch zoom, I replaced zoom with buttons that reload the iframe with a different orthographic scale parameter.",
      "Combined weather data with air quality levels, local time, and wiki summaries through useAirQuality and useCityInsights composables, displayed them in AirQualityCard and CityInsightCard, and reused WeatherCard's el-card style to keep the dashboard visually consistent.",
      "Built a Today's Brief that shows weather for the user's current location via browser geolocation and falls back to Seoul if permission is denied or fails, plus logic that recommends outfits, umbrellas, and hydration for morning, noon, afternoon, and evening based on weather, temperature, and humidity.",
      "Added a remove button to city cards, persisted the search query and results in sessionStorage so they survive a refresh, confirmed ESLint passes and the API key is kept in `.env`, and deployed the static build to Vercel."
    ],

    result: `
      The live wind globe rotates by drag and zooms with the buttons, and the air quality card, city info card, and time-of-day outfit recommendations update for the selected city. I also verified city removal, search state persisting across refreshes, partial queries such as 'Copen' and 'Frank' finding the right city, and repeated identical searches adding a card only once.
    `,

    learned: `
      I learned that keeping search results (preview) and the confirmed list in separate state makes a 'search, review, then add' UX natural. A seemingly simple bug (duplicate cards) turned out to involve IME events, an async race condition, and the duplicate check all at once, which taught me to isolate and verify each cause one by one. I also worked around the fact that cross-origin iframes do not pass wheel and touch events to the parent by reloading with URL parameters, and saw that reusing the same Element Plus style across card components keeps the UI consistent as features grow.
    `
  },

  "vue-code-challenge": {
    title: "Vue.js Code Challenge Dashboard",

    description:
      "Implemented 14 challenges, from Vue basics and directives through event handling, Composition API, component communication, Pinia, Axios, Element Plus, modern JavaScript, and Vite build and deployment, as a dashboard that tracks learning progress.",

    overview: `
      This project collects 14 challenges, covering Vue basics, the Composition API, component communication, Pinia, Axios, Element Plus, modern JavaScript, and Vite build and deployment, in a single dashboard. Choosing a challenge in the side navigation renders its example component immediately, and checking it off updates a learning progress tracker. The dashboard also links to and from the separately deployed Weather Dashboard project.
    `,

    process: [
      "Built examples of Vue directives (v-html/v-text, v-bind shorthand, v-if/v-show, v-for, v-once/v-memo, v-pre/v-cloak) and a VueHtmlXss component that demonstrates the XSS risk of v-html, to compare how each directive behaves.",
      "Built event handling examples covering the event object and modifiers, v-model examples (basic, forms, modifiers), and a step-by-step set of Composition API examples from reactive state (ref, reactive) to computed and six watch patterns (basic, multiple, deep, reactive, watchEffect).",
      "Implemented lifecycle hooks and parent–child props/emit communication with LifecycleParent and PropsEmitsParent, and built default, named, and scoped slot patterns, each as a parent–child component pair.",
      "Practiced global state management with a Pinia StoreCounter, then used Axios for a weather API lookup (AxiosWeather) and JSON REST CRUD (AxiosJson), and extended it into an e-commerce example with AxiosProducts, which fetches products from a public API (dummyjson.com), and a cart store.",
      "Added a UI library challenge with a product list built from Element Plus components (ElInput, ElCard, ElAlert, ElTag), sharing a useProducts composable with AxiosProducts to reuse the same data-fetching logic, followed by a modern JavaScript challenge on ES6+ patterns such as destructuring, spread, and optional chaining.",
      "Added a 14th challenge on Vite builds covering custom ESLint rules (eqeqeq, no-console) and environment-specific builds with `.env.staging` and `.env.production`, and used a Pinia useLearningStore to track completion and progress (progressRate) across all 14 challenges, reflected live in the side navigation and progress bar."
    ],

    result: `
      All 14 challenges work when switched from the side navigation, and I verified that the 'Mark complete' and 'Reset progress' features calculate the progress rate (0–100%) correctly. The Axios Products example displays products fetched from a real public API, and the Vite build challenge correctly shows different API URLs in staging and production modes.
    `,

    learned: `
      I learned that directives differ in when they render and how they handle reactivity (one-time rendering with v-once, conditional caching with v-memo, the XSS risk of v-html, and so on), and how to choose the right watch style (single, multiple, deep, watchEffect) in the Composition API. I also saw that extracting shared API logic into a composable lets multiple components show consistent data without duplicate code, and the Vite build challenge showed me why custom ESLint rules and environment-specific env files matter in a real deployment pipeline.
    `
  },

  "python-comprehension-aggregation": {
    title: "Advanced Python Data Aggregation",

    description:
      "An advanced Python exercise that aggregates sales data in several ways with list/dict comprehensions, Counter, defaultdict, and generators, and compares the memory usage of lists and generators.",

    linkLabels: ["Practice 1 Source Code"],

    overview: `
      An advanced Python exercise that aggregates sales transactions (month, region, category, amount) in several ways using list and dict comprehensions, Counter, defaultdict, and generators. In a single script I implemented, step by step, filtering high-value transactions, total revenue by region, transaction counts by region, amount lists by category, grouped totals by month and category, and a top-3 ranking by amount.
    `,

    process: [
      "Filtered transactions above a threshold with a list comprehension, and calculated total revenue per region with a dict comprehension over a set of unique regions built with a set comprehension.",
      "Counted transactions per region by frequency with Counter, and grouped amounts by category into auto-initialized lists with defaultdict(list), with no extra defensive code.",
      "Compared the object size (sys.getsizeof) of a generator, which produces values one at a time on demand, with a list comprehension to verify the difference in memory use, and confirmed that a generator is single-use and cannot be rewound by creating a new one instead of reusing it.",
      "Accumulated amounts in a defaultdict(float) keyed by (month, category) tuples, then used a comprehension to rebuild readable 'YYYY-MM_category' keys for monthly revenue by category."
    ],

    result: `
      All five tasks (high-value filtering, Counter/defaultdict aggregation, generator memory comparison, month-category grouping, and the top-3 ranking by amount) were verified with assert statements, including a check that the sum of revenue by region matches total revenue.
    `,

    learned: `
      I found that comprehensions are concise and declarative, but lose readability as conditions grow, so they should be chosen over regular loops case by case. defaultdict removes the need for 'does this key exist' checks, and generators are memory-efficient but single-use, so they need to be recreated whenever the data must be iterated again.
    `
  },

  "python-pydantic-validation-pipeline": {
    title: "File I/O Error Handling & Pydantic Validation Pipeline",

    description:
      "A file I/O and exception handling exercise that safely reads a CSV, validates it against a Pydantic v2 schema, separates valid rows from errors, saves both as CSV and JSON, and reloads them, using try/except/else/finally and logging.",

    linkLabels: ["Practice 2 Source Code"],

    overview: `
      A file I/O and exception handling pipeline that safely reads a CSV file, validates it with a Pydantic v2 schema (SalesRecord), separates valid rows from errors, saves the results as CSV and JSON, and reads them back to confirm the counts. I combined the try/except/else/finally structure with logging so that failure points can be traced.
    `,

    process: [
      "Defined a SalesRecord Pydantic model where month and region cannot be empty strings and amount must be greater than 0, making the validation rules explicit in the schema.",
      "In safe_load_csv, handled FileNotFoundError and OSError separately, logged success in the else block, and always logged 'loading finished' in the finally block, so the program keeps running even when loading fails.",
      "Of 7 source records, kept 4 valid and deliberately broke 3 (missing month, missing region, negative amount) to verify that validate_records handles ValidationError safely and splits records into valid and errors lists.",
      "Converted valid records to dicts with model_dump() and saved them as CSV, saved the error list as JSON with ensure_ascii=False so Korean text is preserved, and guarded against write failures (OSError) with save_results_safely.",
      "Fixed a path where a failed load passed raw_data=None into validation and crashed with a TypeError by adding an if raw_data is None guard, and labeled the pipeline stages [1]–[4] with start/end banners so progress is easy to follow."
    ],

    result: `
      Every stage was checked with asserts on the expected counts: safe_load_csv returns None without raising for a missing file, and the pipeline goes from loading the source CSV to validation (4 valid, 3 errors) to saving to reloading (4 records), finally printing 'all checkpoints passed'.
    `,

    learned: `
      I learned that instead of catching exceptions broadly, it is better to catch common cases such as FileNotFoundError specifically for clearer messages, and to use else and finally to separate code that should run only on success from code that should always run, which makes debugging easier. I also learned that if a function promises to 'fail safely' by returning None, the next step must guard against None too, or the promise breaks.
    `
  },

  "python-async-api-pipeline": {
    title: "Async API Collection, Validation & Storage Pipeline",

    description:
      "A mini data pipeline that collects data from three public APIs concurrently with asyncio and httpx, validates it with Pydantic, stores it as both CSV and Parquet to compare performance, and applies pytest and ruff.",

    linkLabels: ["Project Report (PDF, Korean)", "Project Source Code"],

    overview: `
      A mini data pipeline that concurrently collects data from three public APIs (Open-Meteo weather, Countries.dev country info, and ip-api IP geolocation) with asyncio and httpx, validates value types and ranges with Pydantic, saves the validated data as both CSV and Parquet, and compares which format is faster. run_pipeline.py calls three modules in order: collect, schema (validation), and storage (save and compare).
    `,

    process: [
      "Built a collect module that calls the three APIs concurrently with httpx.AsyncClient and asyncio.gather, and measured the speedup of async over sequential calls with compare_speed.py.",
      "Defined hourly Seoul weather records (WeatherRecord) as a Pydantic v2 model that validates the types and ranges of fields such as temperature and precipitation probability, and used demo_validation_error.py to confirm that an impossible value such as 150% precipitation is caught as a ValidationError.",
      "Converted validated data into a pandas DataFrame, saved it as CSV and Parquet, and measured write and read times to compare the two formats at different data sizes.",
      "Made the pipeline write an error report to output/errors.json instead of crashing on validation errors, and stop safely without saving when there are zero valid records.",
      "Tested the schema validation logic with pytest, fixed a ModuleNotFoundError where bare pytest could not find the src module by setting pythonpath in pyproject.toml, and applied lint and formatting rules with ruff."
    ],

    result: `
      At 72 rows, Parquet was actually slower than CSV. When I replicated the same data 1,000 times (72,000 rows) and compared again, Parquet's advantage appeared as the data grew. Async collection was noticeably faster than sequential calls, and schema validation correctly caught errors in deliberately corrupted data.
    `,

    learned: `
      I confirmed that there is no universally correct file format: whether CSV or Parquet performs better depends on data size. I also confirmed that running I/O-bound work concurrently with asyncio.gather gives a clear speedup over sequential calls, and learned that splitting each stage of a pipeline (collect, validate, store) into its own module makes it easier to pinpoint where failures happen and to produce error reports.
    `
  },

  "adult-income-e2e-analysis": {
    title: "Adult Census Income: End-to-End Data Analysis",

    description:
      "An end-to-end analysis of the UCI Adult income dataset: pre-registered hypotheses, a statistical diagnosis of why data is missing, a benchmark of MICE and deep-learning imputation methods, and a comparison of classification models.",

    linkLabels: ["Project Report (PDF, Korean)", "Project Source Code"],

    overview: `
      An end-to-end analysis of the UCI Adult census income data (32,561 training rows, 16,281 test rows). To avoid fitting the story to the results, I registered the hypotheses and decision criteria before running any analysis, diagnosed statistically why values were missing, and then compared several imputation methods and classification models. The whole workflow is reproducible from a single script (main.py): dual loading and verification with Pandas and Polars, statistical tests, a benchmark of MICE and deep-learning (CACTI/TabNAT-style) imputation, and an ML pipeline centered on logistic regression.
    `,

    process: [
      "Pre-registered four hypotheses (H1: working hours differ by income; H2: associations between variables; H3: the cause of missingness; H4: which imputation method is best) and decision criteria (α=0.05) before the analysis, to avoid fitting the story to the results.",
      "Loaded the data with both Pandas and Polars, asserted that row and column counts, missing counts, and aggregates matched within 1e-9, and benchmarked the loading and aggregation speed of both libraries.",
      "Trained a logistic regression that predicts whether workclass and occupation are missing from observed variables, reaching AUC 0.7185 (bootstrap 95% CI lower bound 0.7065), and concluded that the data is hard to reconcile with a missing-completely-at-random (MCAR) assumption (H3).",
      "Designed a benchmark that deliberately removes values and restores them, and compared median/mode, kNN, MICE (IterativeImputer), and CACTI/TabNAT-style deep-learning imputation under MAR and MCAR scenarios, 10 runs each (H4).",
      "Ran Welch's t-test, Pearson/Spearman correlations, and chi-square tests with Holm correction for multiple comparisons, and re-tested with winsorized data to check whether conclusions changed depending on how extreme values were handled (H1, H2).",
      "Trained logistic regression, linear SVM, HistGradientBoosting, and XGBoost in a leakage-safe ColumnTransformer pipeline, evaluated them exactly once on adult.test, and saved and reloaded the model with joblib to verify identical predictions."
    ],

    result: `
      The high-income (>50K) group worked on average 6.63 more hours per week than the lower-income group (95% CI [6.34, 6.92], Hedges' g = 0.55), and the conclusion held after winsorization. Missing occupation values were predictable from observed variables, which is hard to reconcile with MCAR; under this diagnosis, MICE reduced numeric imputation error more consistently than simple imputation in 10 out of 10 runs. The primary model, logistic regression, achieved F1 0.6518 and ROC-AUC 0.9033, while the comparison model, HistGradientBoosting, reached a higher F1 of 0.7083.
    `,

    learned: `
      Through this exercise I came to understand that a p-value is not 'the probability that there is no difference' but the probability of seeing a difference at least this large by chance if there were none, and that MAR and MNAR fundamentally cannot be distinguished from observed data alone. I also learned that the model with the best predictive performance (HGB, XGBoost) is not always the best choice. When the goal is to interpret relationships between variables, logistic regression, whose odds ratios can be read directly, may be more appropriate. Finally, the apparent advantage of deep-learning imputation must be interpreted cautiously when it rests on few runs and a single implementation.
    `
  },

  "vote-app": {
    title: "Link-Shareable Voting Website",

    description:
      "A voting website that anyone can create and join with a single link, no account needed. It supports option polls and When2meet-style scheduling, anonymous or named voting, multiple choice, abstaining, deterministic roulette or run-off votes for ties, and per-poll admin passwords, and is built with React (Vite), Cloudflare Workers, and Cloudflare KV and deployed to Cloudflare. Built in a one-day class.",

    overview: `
      A voting website where anyone can create and join a poll with a single link, no login required. It supports both option polls (for picking a menu, a restaurant, and so on) and When2meet-style scheduling grids that overlay everyone's availability. Other features include anonymous/named mode, multiple choice, abstaining, a participant list with completion status, manual, time-based, or all-voted closing, and tie handling with either a deterministic roulette or a run-off vote among the tied options (the same link, with only the round number increasing). A single Worker serves both the React (Vite) frontend and the Cloudflare Workers API, with Cloudflare KV as storage.
    `,

    process: [
      "Defined the core requirements first, such as toggles for anonymous and multiple-choice voting, and designed the architecture around React (Vite), Cloudflare Workers, and Cloudflare KV: a React SPA frontend, a Worker API backend, and KV as the database.",
      "Applied a concurrency-safe design with 'one vote = one KV key', storing tallies in KV metadata so no votes are lost when many people vote at the same time.",
      "Implemented duplicate-vote prevention using hashed IPs (allowing up to 5 people by default to account for shared office networks), per-poll admin passwords, and a global admin page (/admin) to balance anonymity with abuse prevention.",
      "Implemented two tie-handling flows: a deterministic roulette draw, and a run-off vote among tied options held on the same link by advancing the round.",
      "Used Vitest with @cloudflare/vitest-pool-workers to run tests in a real workerd and KV environment: unit tests for tallying, bitmasks, and roulette determinism, and a concurrency API test verifying that no votes are lost when 20 people vote at once.",
      "Configured the KV namespace and secrets (AUTH_SECRET, IP_SALT, ADMIN_PASSWORD) with wrangler and deployed to Cloudflare Workers, completing a service that is reachable at a live URL.",
      "Developed the project in the terminal with the Claude Code CLI, learning a CLI workflow that includes switching models and reasoning effort with /model and /effort, having the agent ask clarifying questions about ambiguous requirements, resuming sessions with /resume, canceling with Esc, and adding line breaks in prompts with Option+Enter."
    ],

    result: `
      The site is deployed at a live Cloudflare Workers URL (vote-app.choi-gyuwon03-bec.workers.dev), where polls can be created and joined with just a link. In a concurrency test with 20 simultaneous voters, KV tallies were accurate with no lost votes. I verified that both option polls and scheduling (When2meet grid) handle anonymous/named voting, multiple choice, abstaining, closing conditions, and tie handling (roulette or run-off) as intended.
    `,

    learned: `
      I learned that designing the data model around concurrency up front, as in 'one vote = one KV key', makes lossless tallying possible even on an eventually consistent store like KV. Using Claude Code in the CLI, I also learned a terminal-based AI pair programming workflow, including switching modes (Shift+Tab), slash commands such as /model and /effort, having the agent re-confirm requirements with clarifying questions, and resuming sessions with /resume. I also learned a lightweight full-stack deployment approach where a single Cloudflare Worker serves both the frontend and the API with KV.
    `
  },

  "eventfit-msa": {
    title: "EventFIT: Wedding Planning MSA Platform",

    description:
      "A team Agile and MSA project in which our team (Class 8, Team 6) adapted and extended a course template with Spring Boot microservices (members, products, bookings, payments, recommendations), Kafka events, an API Gateway, Eureka, and JWT authentication into a wedding planning service.",

    linkLabels: ["Agile/Scrum & MSA Study Notes (PDF, Korean)"],

    overview: `
      The course provided an MSA template (msa-lecture) with Eureka, an Auth Server, an API Gateway, Spring Boot services for members, products, bookings, and payments, and a FastAPI recommendation service. Our team (Class 8, Team 6) adapted and extended its domain into "EventFIT", a wedding planning service. We kept the infrastructure (Eureka, Auth Server, Gateway) as a fixed contract and changed only the entities, APIs, and Kafka payloads of the five business services (members, products, bookings, payments, recommendations) to fit the wedding domain.
    `,

    process: [
      "Learned Agile/Scrum as a way of building, demoing, and improving in short sprints rather than following a waterfall plan, and agreed as a team on the product backlog, sprint backlog, user stories, and definition of done.",
      "Kept the MSA infrastructure contract (single entry through the API Gateway, Eureka service discovery, JWT authentication, Kafka messaging) unchanged, and redesigned only the domain logic of five services: User (role → user_type), Course (wedding products: studio, dress, makeup), Enrollment (bookings), Payment (payments and refunds), and Recommend (FastAPI recommendations).",
      "Instead of confirming bookings synchronously at payment time, implemented event-driven communication where a payment.completed Kafka event is consumed by enrollment-service to move bookings from PENDING to ACTIVE automatically, and added idempotent processing with a processed_events table to prevent duplicate consumption.",
      "Designed refunds as a human-in-the-loop flow in which the vendor (VENDOR), not the platform operator, approves or rejects them, and implemented internal API calls from payment-service to enrollment-service so that payment, refund, and booking cancellation stay consistent across service boundaries.",
      "Added a new rule-based recommendation engine (wedding_service) to recommend-service (FastAPI) that takes budget, priorities, region, and wedding date, fetches candidate products from course-service, and searches for combinations that fit the budget.",
      "Documented deployment troubleshooting (wrong docker-compose file paths, the Docker daemon not running, running without a compose file) in cause-and-fix order, and built the habit of checking files and engine state step by step instead of changing commands based only on error messages."
    ],

    result: `
      Ten containers, including MariaDB, Kafka, Eureka, the Auth Server, the API Gateway, and the five business services, started correctly with docker compose, and every service's Swagger UI and FastAPI docs page responded. The booking → payment → Kafka event → automatic booking confirmation flow and the refund request → vendor approval → booking cancellation flow both ran according to the designed sequences.
    `,

    learned: `
      By building it myself, I came to understand that Agile/Scrum is not about building quickly without a plan but about repeatedly reviewing and improving in short cycles, and that MSA is a loosely coupled structure in which the Gateway, Eureka, Auth, business services, and Kafka each have their own role. I also learned that the constraint of keeping the infrastructure contract (routing paths, Kafka topic structure, JWT contract) while changing only the domain meaning was itself good training in defining clear service boundaries and responsibilities.
    `
  },

  "sllm-fine-tuning-hr-chatbot": {
    title: "sLLM Fine-Tuning: HR Policy Chatbot with RAG & LoRA",

    description:
      "Compared and combined BGE-M3 + FAISS semantic search (RAG) with PEFT/LoRA supervised fine-tuning (SFT) on Qwen2.5-1.5B-Instruct to build an sLLM chatbot specialized in company-specific HR policies.",

    linkLabels: ["sLLM Fine-Tuning Study Notes (PDF, Korean)"],

    overview: `
      A general-purpose LLM does not know a company's own HR policies (remote work, AI training subsidies, and so on). In this sLLM fine-tuning exercise I implemented and compared two ways to fix that: RAG, which keeps knowledge outside the model and retrieves it (BGE-M3 embeddings + FAISS similarity search), and SFT, which trains knowledge into the model (PEFT/LoRA). Applying both to the base model Qwen2.5-1.5B-Instruct showed that they solve different problems: one supplies knowledge, the other teaches response format and behavior.
    `,

    process: [
      "Built a mini knowledge base from six HR policy documents (AI training subsidy limits, application deadlines, approval process, exclusions, refresh leave, remote work) by treating each document as one chunk, embedding it with BGE-M3, and storing it in a FAISS IndexFlatIP.",
      "Implemented a RAG pipeline that embeds each question the same way, retrieves the top 2 most similar documents from FAISS, and passes only those documents to Qwen as context, keeping the roles of embedding (BGE-M3), retrieval (FAISS), and generation (Qwen) separate.",
      "Found cases where retrieval succeeded but the model misread the retrieved document (misinterpreting the rule 'excluded below 80%' and answering 'eligible' for a 70% case), and concluded that SFT was needed to handle conditional reasoning that RAG alone could not.",
      "Applied PEFT with a LoraConfig of rank=16 and target_modules expanded to seven modules (the four attention projections q/k/v/o_proj plus the three MLP projections gate/up/down_proj), training only 18,464,768 of 1,562,179,072 parameters (1.18%), and verified the parameter count from the actual output.",
      "Trained the LoRA adapter on SFT data in a system/user/assistant chat format for HR policy guidance (582 train, 97 validation, 20 evaluation examples), and quantitatively compared the base and fine-tuned models with keyword score, token F1, and hallucination rate.",
      "Solved a Jupyter kernel running outside the project's virtual environment by registering it with ipykernel, and training logs lost past the terminal scrollback by saving them to a file with tee."
    ],

    result: `
      On the 20-question evaluation set, the fine-tuned model won 18 comparisons (base model 1 win, 1 tie), with keyword score improving from 0.065 to 0.2 and token F1 from 0.096 to 0.22. Although only 1.18% of parameters were trained, the total score rose from 0.086 to 0.285. Both models kept a 0% hallucination rate on questions about policies that do not exist, confirming that SFT did not weaken the safe behavior of saying 'I don't know'.
    `,

    learned: `
      I learned that RAG and SFT are complementary: RAG supplies up-to-date facts and source documents as input, while SFT teaches response format and behavior through repeated examples. I also learned that retrieving the relevant chunk and the LLM reasoning correctly about it are separate problems, so retrieval failures and generation (reasoning) failures must be checked separately to find the real cause. Finally, the numbers confirmed that, as the low-rank hypothesis behind LoRA suggests, training a tiny fraction of the parameters can still yield meaningful domain-specific gains.
    `
  }
};
