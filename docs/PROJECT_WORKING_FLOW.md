# Project Working Flow Diagram

This project is a dual-domain RAG assistant. It answers questions from two knowledge sources:

- Uploaded documents such as PDF, TXT, and Markdown files.
- School/student data from PostgreSQL, with an in-memory fallback repository and vector indexing for student dossiers.

## 1. Complete System Flow

```mermaid
flowchart TD
    U[User] --> UI[React UI]
    UI --> Chat[ChatInterface]
    UI --> Upload[DocumentUpload]
    UI --> DBModal[DatabaseSyncModal]

    Upload --> Parse[parseFile: PDF/TXT/MD extraction]
    Parse --> Chunk[chunkDocument: sliding chunks]
    Chunk --> EmbedDoc[generateEmbedding]
    EmbedDoc --> VS[(In-memory VectorStore + localStorage)]

    DBModal --> ViteAPI[Vite middleware API]
    ViteAPI --> PG[(PostgreSQL / Supabase)]
    PG --> Repo[SchoolDataRepository]
    Repo --> Dossier[convertStudentToDossier]
    Dossier --> StudentChunk[chunkDocument]
    StudentChunk --> EmbedStudent[generateEmbedding]
    EmbedStudent --> VS

    Chat --> Router[routeAndAnswerQuery]
    Router --> Optimizer[optimizeQueryWithGemini or local heuristic]
    Optimizer --> Intent{Domain mode / intent}

    Intent -->|Student mode or student intent| StudentEngine[handleStudentDatabaseQuery]
    Intent -->|Document mode or document intent| DocEngine[handleDocumentRAGQuery]

    StudentEngine --> StudentFacts[Verified student facts + analytics]
    StudentFacts --> StudentPrompt[Grounded academic prompt]

    DocEngine --> QueryEmbed[Query embedding]
    QueryEmbed --> HybridSearch[VectorStore hybrid search: cosine + keyword]
    HybridSearch --> TopK[Top-K grounded chunks]
    TopK --> DocPrompt[Grounded document prompt]

    StudentPrompt --> LLM[API key pool and LLM cascade]
    DocPrompt --> LLM
    LLM -->|Groq / Gemini success| Answer[Final answer]
    LLM -->|API unavailable| LocalFallback[Local synthesizer fallback]
    LocalFallback --> Answer

    Answer --> Sources[Sources + PipelineInfo]
    Sources --> Chat
    Chat --> U
    Sources --> Inspector[PipelineInspector]
```

## 2. Document Ingestion Flow

```mermaid
flowchart LR
    File[User uploads PDF/TXT/MD] --> Extract[parseFile extracts text and pages]
    Extract --> Chunks[chunkDocument creates overlapping text chunks]
    Chunks --> Embeddings[generateEmbedding]
    Embeddings --> RemoteOrLocal{Embedding provider available?}
    RemoteOrLocal -->|Yes| GeminiEmbed[Gemini embedding model]
    RemoteOrLocal -->|No| LocalEmbed[64D local semantic hash vectorizer]
    GeminiEmbed --> Store[(VectorStore)]
    LocalEmbed --> Store
    Store --> Persist[Persist chunks in localStorage]
```

## 3. School Database Sync Flow

```mermaid
flowchart LR
    DBConfig[Database credentials in UI] --> ViteAPI[Vite database API]
    ViteAPI --> PG[(PostgreSQL)]
    PG --> Tables[students, guardians, attendance, subject_marks, teacher_comments]
    Tables --> Repository[SchoolDataRepository]
    Repository --> Profiles[StudentProfile objects]
    Profiles --> Dossiers[Student dossier text documents]
    Dossiers --> Chunk[Chunk dossiers]
    Chunk --> Embed[Embed each chunk]
    Embed --> VectorStore[(VectorStore)]
    Repository --> UIState[Student count and DB status in UI]
```

If PostgreSQL is not connected, the repository stays in offline/fallback mode and the UI still works with whatever student data is already available in memory.

## 4. Query Answering Flow

```mermaid
flowchart TD
    Q[Raw user question] --> History[Attach recent chat history]
    History --> Rewrite[Query optimization and pronoun resolution]
    Rewrite --> Mode{Selected mode}

    Mode -->|Auto| Detect[isStudentQuery intent detection]
    Mode -->|Student| StudentPath[Student database path]
    Mode -->|Document| DocumentPath[Document RAG path]
    Detect -->|School/student intent| StudentPath
    Detect -->|Document/general intent| DocumentPath

    StudentPath --> Validate[Validate student/entity/subject]
    Validate --> Analytics{Ranking or analytics query?}
    Analytics -->|Yes| SchoolAnalytics[detectAndExecuteSchoolAnalytics]
    Analytics -->|No| StudentRecords[Build factual student context]
    SchoolAnalytics --> AcademicPrompt[Academic grounded prompt]
    StudentRecords --> AcademicPrompt

    DocumentPath --> QueryVector[Generate query embedding]
    QueryVector --> Search[Hybrid vector + keyword search]
    Search --> Filter[Exclude student chunks from document lane]
    Filter --> Context[Assemble document evidence]
    Context --> DocPrompt[Document grounded prompt]

    AcademicPrompt --> Generate[LLM generation cascade]
    DocPrompt --> Generate
    Generate --> Final[Answer + sources + pipeline timings]
```

## 5. LLM and Failover Flow

```mermaid
flowchart LR
    Prompt[Grounded prompt] --> KeyPool[ApiKeyPool]
    KeyPool --> Provider{Active key provider}
    Provider -->|Groq key| Groq[Groq model cascade]
    Provider -->|Gemini key| Gemini[Gemini model cascade]
    Groq --> Success{Success?}
    Gemini --> Success
    Success -->|Yes| Response[LLM response]
    Success -->|503/404 model unavailable| NextModel[Try next model]
    Success -->|429 quota exceeded| NextKey[Rotate to next key]
    NextModel --> Provider
    NextKey --> Provider
    Success -->|All failed| Fallback[Local dynamic synthesizer]
    Fallback --> Response
```

## 6. Main Code Map

| Area | File | Responsibility |
| :--- | :--- | :--- |
| App shell | `src/App.tsx` | Owns UI state, settings, documents, chat, routing calls, modals, and pipeline inspector state. |
| Query router | `src/services/rag/queryRouter.ts` | Optimizes the question and routes it to student or document handling. |
| Document RAG | `src/services/rag/documentRAGService.ts` | Embeds query, searches uploaded document chunks, builds grounded prompt, generates answer. |
| Vector store | `src/services/rag/vectorStore.ts` | Stores chunks and runs hybrid cosine + keyword retrieval. |
| Embeddings | `src/services/rag/embeddings.ts` | Uses Gemini embeddings when available, otherwise local 64D semantic vectorizer. |
| Prompt optimizer | `src/services/rag/promptOptimizer.ts` | Rewrites vague prompts and resolves pronouns using chat history. |
| Student engine | `src/services/school/studentQueryService.ts` | Detects student queries, validates entities/subjects, builds factual school prompts. |
| School sync | `src/services/school/schoolDataRepository.ts` | Talks to database API, stores student profiles, tracks status. |
| Student indexing | `src/services/school/schoolRagAdapter.ts` | Converts student records to dossier documents and indexes them into the vector store. |
| Database backend | `vite.config.ts`, `src/server/postgresService.ts` | Provides Vite middleware API for status, config, fetch, insert, and schema initialization. |
| Pipeline UI | `src/components/PipelineInspector.tsx` | Displays the current retrieval/generation pipeline details. |

## 7. Short Working Summary

1. User uploads documents or syncs PostgreSQL student records.
2. Text is extracted, chunked, embedded, and stored in `VectorStore`.
3. User asks a question in chat.
4. The router rewrites the query and decides between the student database engine and document RAG engine.
5. The selected engine builds a strictly grounded prompt from verified facts or retrieved chunks.
6. The API key pool tries Groq/Gemini models with automatic model and key failover.
7. If cloud generation fails, the app uses a local fallback synthesizer.
8. The UI displays the answer, sources, timings, and pipeline trace.
