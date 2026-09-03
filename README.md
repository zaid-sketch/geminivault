# GeminiVault - Secure AI Personal Journal & Reflection Sanctuary

GeminiVault is a production-grade personal journaling and reflection web application built on Google Cloud, Firebase Authentication, Cloud Firestore, and modern TypeScript/React. It implements a zero-trust, owner-isolated data architecture ensuring that personal journal reflections are cryptographically guarded by Google OAuth and strictly partitioned at the Firestore engine level.

---

## 1. Architecture & Threat Modeling Overview

GeminiVault addresses the OWASP Top 10 (Web) and OWASP Top 10 for LLM Applications:

| Threat Zone | Identified Risk Scenario | Countermeasure & Defensive Architecture |
| :--- | :--- | :--- |
| **Input Surfaces** | Untrusted journal content, script injection (XSS), oversized storage payload. | Strict client-side validation (`title` ≤ 150 chars, `content` ≤ 50,000 chars, `tags` bounded list), React DOM auto-escaping, and strict undefined-stripping prior to Firestore writes. |
| **Planning & Reasoning** | Indirect prompt injection via reflection text (OWASP LLM01). | Plain-data encapsulation: User journal entries are stored and processed purely as passive text, preventing executable instruction hijacking. |
| **Tool Execution** | Unauthorized document mutation or cross-tenant reads. | Owner-bound Firestore Security Rules (`request.auth.uid == userId`) prohibiting cross-user data access. |
| **Memory & State** | Session hijacking, cross-user data leakage. | Federated Google Sign-In via Firebase Auth; auth token verification; reactive client state listeners; automatic state purge on sign-out. |
| **Inter-System Communication** | Server secret leakage, hardcoded API credentials. | Zero hardcoded credentials in client code; runtime configuration loaded dynamically from environment/secure config files; no client exposure of privileged keys. |

---

## 2. Environment & Prerequisites

1. **Google Cloud Project**: An active GCP project with billing enabled.
2. **Google Cloud SDK (`gcloud` CLI)**: Installed and authenticated (`gcloud auth login`).
3. **APIs Required**:
   - Cloud Run API (`run.googleapis.com`)
   - Secret Manager API (`secretmanager.googleapis.com`)
   - Cloud Firestore API (`firestore.googleapis.com`)
   - Identity Toolkit API (`identitytoolkit.googleapis.com`)

```bash
# Enable required Google Cloud APIs
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  identitytoolkit.googleapis.com \
  --project="YOUR_PROJECT_ID"
```

---

## 3. Database Security Configuration (Cloud Firestore)

Deploy the following security rules to Cloud Firestore to enforce strict, zero-trust owner isolation:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User profile document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      // User journal entries - Isolated to authenticated owner
      match /entries/{entryId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      // User AI reflections and interactions
      match /interactions/{interactionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      // User AI reflection insights - Isolated to authenticated owner
      match /reflections/{reflectionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

Deploy the rules using Firebase CLI:
```bash
firebase deploy --only firestore:rules
```

---

## 4. Secret Management Setup

GeminiVault prohibits hardcoded strings and requires operational credentials to be injected via Google Cloud Secret Manager.

```bash
# Create and populate the secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# Grant the Cloud Run runtime service account access to read the secret
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 5. Cloud Run Deployment Flow

Build and deploy the application container to Cloud Run:

```bash
# Build and deploy directly with Google Cloud Build and Cloud Run
gcloud run deploy geminivault \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest"
```

### Required Campaign Verification Labeling

To register the service for automated challenge verification, apply the required resource label:

```bash
gcloud run services update geminivault \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

## 6. Functional Stability & Step-by-Step Test Walkthrough

Every feature and user interaction is mapped below to reproducible test cases:

### Test Suite 1: Authentication & Protection
- **TC-AUTH-01 (Unauthenticated Redirection)**:
  - *Action*: Open the root URL as a visitor without an active session.
  - *Expected*: The polished GeminiVault landing page renders immediately. Dashboard components and journal entries are inaccessible.
- **TC-AUTH-02 (Google Sign-In Trigger)**:
  - *Action*: Click `Enter GeminiVault with Google` or the header sign-in button.
  - *Expected*: Firebase Auth launches Google OAuth popup. On user approval, state transitions from loading spinner to the protected Dashboard.
- **TC-AUTH-03 (Account & Security Modal)**:
  - *Action*: Click the user profile area in the top navigation bar.
  - *Expected*: Account modal opens, displaying the authenticated Google display name, email, avatar, and the isolated Firestore partition path (`/users/{uid}/entries`).
- **TC-AUTH-04 (Sign Out Execution)**:
  - *Action*: Click `Sign Out` from either the navigation bar or profile modal.
  - *Expected*: Session is terminated, memory state is purged, and the user is returned to the landing page.

### Test Suite 2: Journal Creation & Transaction Integrity
- **TC-JOURNAL-01 (Distraction-Free Composition)**:
  - *Action*: Navigate to `New Journal`. Enter a title, select a mood (e.g. `Peaceful`), and type reflections.
  - *Expected*: Word counter, character limit (`0/150`), and estimated reading time update in real time.
- **TC-JOURNAL-02 (Guided AI Prompts)**:
  - *Action*: Click `Spark Reflection`. Select any suggested prompt (e.g. `Stoic Perspective`).
  - *Expected*: Prompt automatically populates the journal content and title with clean markdown quotation.
- **TC-JOURNAL-03 (Tagging & Pinning)**:
  - *Action*: Type `#mindfulness` and press Enter. Toggle `Pin entry` and `Favorite`.
  - *Expected*: Tags render as removable chips. Pin and Favorite states reflect active selection.
- **TC-JOURNAL-04 (Persistence & Undefined Stripping)**:
  - *Action*: Click `Save to GeminiVault`.
  - *Expected*: Payload is sanitized (zero `undefined` properties), persisted to `/users/{uid}/entries/{id}` in Firestore, a success toast appears, and fields reset.
- **TC-JOURNAL-05 (Error Escalation & Retry)**:
  - *Action*: Attempt to save with network offline or empty content.
  - *Expected*: Error banner renders, input draft is preserved without data loss, and `Retry Save` is available.

### Test Suite 3: Journal History & Real-Time CRUD
- **TC-HIST-01 (Real-Time Synchronized Listing)**:
  - *Action*: Navigate to `Journal History`.
  - *Expected*: User's entries render in reverse-chronological order with pinned items prioritized at the top.
- **TC-HIST-02 (Keyword & Mood Filtering)**:
  - *Action*: Type in the search input or select `Reflective` in the mood filter dropdown.
  - *Expected*: Results filter instantly without network roundtrips.
- **TC-HIST-03 (Entry Reader Modal)**:
  - *Action*: Click `Read` or any card title.
  - *Expected*: Full reader modal renders formatted text, mood indicator, timestamp, word count, and prompt details.
- **TC-HIST-04 (In-Place Update)**:
  - *Action*: Click `Edit` on an entry. Modify title/content and click `Save Changes`.
  - *Expected*: Firestore document updates immediately, and changes reflect live in the list.
- **TC-HIST-05 (Delete with Confirmation)**:
  - *Action*: Click `Delete` on an entry. Click `Confirm Delete` in the modal dialog.
  - *Expected*: Document is permanently removed from Firestore and disappears from view.

### Test Suite 4: AI Assistant & Reflection Insights
- **TC-AI-01 (Prompt Exploration)**:
  - *Action*: Navigate to `AI Assistant`. Select a category (e.g. `Decision Making & Clarity`).
  - *Expected*: Relevant prompts display with `Copy` and `Write This` actions.
- **TC-AI-02 (Seamless Transfer)**:
  - *Action*: Click `Write This` on any prompt.
  - *Expected*: Active tab switches to `New Journal`, pre-populating the editor with the selected prompt.
- **TC-INSIGHT-01 (Dynamic Analytics Computation)**:
  - *Action*: Navigate to `Reflection Insights` and select `Vault Metrics & Trends`.
  - *Expected*: Total entries, word counts, current streak, mood spectrum progress bars, and top tags are computed and rendered dynamically from real Firestore documents.

### Test Suite 5: Cognitive Reflection Analysis & Intelligence
- **TC-REFL-01 (Journal Entry Selection)**:
  - *Action*: In `Reflection Insights` (`AI Reflection Studio`), use `Recent 3`, `Recent 5`, or manual checkboxes to select entries. Filter entries using the search bar or mood dropdown.
  - *Expected*: Selection count and total word estimates update dynamically. The `Generate Reflection Insights` button is disabled when zero entries are selected and enabled when ≥1 entry is chosen.
- **TC-REFL-02 (Resilient Gemini Synthesis)**:
  - *Action*: Click `Generate Reflection Insights`.
  - *Expected*: Loading state displays animated step indicators. Backend executes the multi-model fallback ladder (`gemini-3.6-flash` -> `gemini-3.1-flash-lite` -> `gemini-flash-latest` -> `gemini-3.7-flash`).
- **TC-REFL-03 (Structured Demarcated Report)**:
  - *Action*: Review generated reflection.
  - *Expected*: AI Demarcation Banner clearly displays model information and tenant confidentiality. Report provides:
    1. Executive Reflection Summary
    2. Key Themes (bulleted clusters)
    3. Emotional Patterns & Valence
    4. Positive Progress & Breakthroughs (emerald highlights)
    5. Recurring Challenges & Frictions (amber highlights)
    6. 3 Thoughtful Follow-Up Reflection Questions
- **TC-REFL-04 (Follow-Up Question Journaling)**:
  - *Action*: Click `Reflect on This` next to any of the 3 follow-up reflection questions.
  - *Expected*: Active tab switches to `New Journal`, pre-populating the editor with the chosen question as the active prompt.
- **TC-REFL-05 (Vault Persistence & History)**:
  - *Action*: Click `Save to Vault`. Navigate to `Saved Vault Reflections`.
  - *Expected*: Reflection is persisted to `/users/{userId}/reflections/{id}` with owner-isolation rules enforced. Saved reflections can be opened, reviewed in detail, exported as Markdown, or deleted.
- **TC-REFL-06 (Error Recovery & Retry)**:
  - *Action*: Trigger synthesis when offline or under simulated failure.
  - *Expected*: Clear error alert appears with a `Retry Analysis` button that preserves current selections and re-attempts generation on demand.

