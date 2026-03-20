# Learning Path Completion Tracking - Backend Implementation

## Overview

The backend now tracks overall learning path completion and provides endpoints to:
1. Check if a user has completed the entire curriculum
2. Return congratulations message when complete
3. Verify eligibility for certificate minting
4. Prevent duplicate certificate minting

## Key Changes

### 1. Courses Service (`courses.service.ts`)

#### New Methods:

**`getTotalStepsInCurriculum()`**
- Calculates total steps across all courses in the curriculum
- Returns: `number`

**`getOverallProgress(userId: string)`**
- Tracks user's progress across ALL courses
- Returns:
  ```typescript
  {
    totalSteps: number,
    completedSteps: number,
    progressPercentage: number,
    isComplete: boolean,
    courseProgress: Array<{
      courseId: number,
      courseTitle: string,
      completedSteps: number,
      totalSteps: number,
      progressPercentage: number,
      isComplete: boolean
    }>
  }
  ```

#### Modified Methods:

**`completeStep()`**
- Now returns additional fields:
  - `curriculumComplete`: boolean indicating if entire curriculum is done
  - `overallProgressPercentage`: overall completion percentage
  - `justCompleted`: boolean indicating if this was a new completion (not already completed)

### 2. Courses Controller (`courses.controller.ts`)

#### New Endpoint:

**`GET /api/v1/courses/progress/overall`**
- Requires authentication
- Returns user's overall progress across all courses
- Use this to show congratulations banner when `isComplete: true`

### 3. Certificates Service (`certificates.service.ts`)

#### Modified Methods:

**`mint()`**
- Now validates curriculum completion before minting
- Checks if certificate already exists (prevents duplicates)
- Throws `BadRequestException` if:
  - Curriculum not 100% complete
  - Certificate already minted for this user

#### New Methods:

**`checkEligibility(userId: string)`**
- Checks if user can mint a certificate
- Returns:
  ```typescript
  {
    isEligible: boolean,
    curriculumComplete: boolean,
    progressPercentage: number,
    alreadyMinted: boolean,
    certificate: Certificate | null,
    message: string  // Congratulations or status message
  }
  ```

### 4. Certificates Controller (`certificates.controller.ts`)

#### New Endpoint:

**`GET /api/v1/certificates/eligibility`**
- Requires authentication
- Returns eligibility status and congratulations message
- Frontend should call this to show certificate minting UI

## API Flow for Frontend

### 1. Get Progress Summary (NEW - Optimized Endpoint)

```bash
GET /api/v1/courses/progress/summary
Authorization: Bearer <token>

Response:
{
  "completedCourses": 3,
  "totalCourses": 4,
  "overallPercentage": 75,
  "completedSteps": 14,
  "totalSteps": 18,
  "courses": [
    {
      "courseId": 1,
      "progressPercentage": 100,
      "completedSteps": 6,
      "totalSteps": 6,
      "isComplete": true
    },
    {
      "courseId": 2,
      "progressPercentage": 100,
      "completedSteps": 4,
      "totalSteps": 4,
      "isComplete": true
    },
    {
      "courseId": 3,
      "progressPercentage": 100,
      "completedSteps": 4,
      "totalSteps": 4,
      "isComplete": true
    },
    {
      "courseId": 4,
      "progressPercentage": 0,
      "completedSteps": 0,
      "totalSteps": 4,
      "isComplete": false
    }
  ]
}
```

**Frontend Action:**
- Use this SINGLE endpoint instead of making 7 separate calls
- Build `progressMap` from the `courses` array
- Show overall progress in hero widget using `overallPercentage`
- Display course cards with individual `progressPercentage`

**Performance:**
- ✅ 1 API call instead of 7
- ✅ 1 database query instead of N queries
- ✅ Faster page load
- ✅ Reduced server load

### 2. When User Completes a Step

```bash
POST /api/v1/courses/:courseId/lessons/:lessonId/steps/:stepId/complete
Authorization: Bearer <token>

Response:
{
  "id": "uuid",
  "userId": "uuid",
  "courseId": 3,
  "lessonId": 2,
  "stepId": 1,
  "state": "completed",
  "completedAt": "2024-03-20T10:30:00Z",
  "curriculumComplete": true,  // ← Check this!
  "overallProgressPercentage": 100,
  "justCompleted": true
}
```

**Frontend Action:**
- If `curriculumComplete: true` AND `justCompleted: true`, show congratulations modal/banner
- Redirect to certificate page or show "Mint Certificate" button

### 3. Check Overall Progress (Detailed)

```bash
GET /api/v1/courses/progress/overall
Authorization: Bearer <token>

Response:
{
  "totalSteps": 18,
  "completedSteps": 18,
  "progressPercentage": 100,
  "isComplete": true,  // ← Curriculum complete!
  "courseProgress": [
    {
      "courseId": 1,
      "courseTitle": "Bitcoin Fundamentals",
      "completedSteps": 6,
      "totalSteps": 6,
      "progressPercentage": 100,
      "isComplete": true
    },
    // ... other courses
  ]
}
```

**Frontend Action:**
- Use this on dashboard/learning path page to show overall progress
- If `isComplete: true`, show "Mint Certificate" CTA

### 3. Check Overall Progress (Detailed)

```bash
GET /api/v1/courses/progress/overall
Authorization: Bearer <token>

Response:
{
  "totalSteps": 18,
  "completedSteps": 18,
  "progressPercentage": 100,
  "isComplete": true,  // ← Curriculum complete!
  "courseProgress": [
    {
      "courseId": 1,
      "courseTitle": "Bitcoin Fundamentals",
      "completedSteps": 6,
      "totalSteps": 6,
      "progressPercentage": 100,
      "isComplete": true
    },
    // ... other courses
  ]
}
```

**Frontend Action:**
- Use this for detailed progress tracking with course titles
- If `isComplete: true`, show "Mint Certificate" CTA

**Note:** For most cases, use `/progress/summary` instead as it's more optimized.

### 4. Check Certificate Eligibility

```bash
GET /api/v1/certificates/eligibility
Authorization: Bearer <token>

Response (Eligible):
{
  "isEligible": true,
  "curriculumComplete": true,
  "progressPercentage": 100,
  "alreadyMinted": false,
  "certificate": null,
  "message": "Congratulations! You've completed the entire curriculum and can now mint your certificate!"
}

Response (Already Minted):
{
  "isEligible": false,
  "curriculumComplete": true,
  "progressPercentage": 100,
  "alreadyMinted": true,
  "certificate": { /* certificate object */ },
  "message": "You have already minted your certificate!"
}

Response (Not Complete):
{
  "isEligible": false,
  "curriculumComplete": false,
  "progressPercentage": 67,
  "alreadyMinted": false,
  "certificate": null,
  "message": "Complete all courses to unlock certificate minting."
}
```

**Frontend Action:**
- Show the `message` to the user
- Enable/disable "Mint Certificate" button based on `isEligible`
- If `alreadyMinted: true`, show existing certificate

### 4. Check Certificate Eligibility

```bash
GET /api/v1/certificates/eligibility
Authorization: Bearer <token>

Response (Eligible):
{
  "isEligible": true,
  "curriculumComplete": true,
  "progressPercentage": 100,
  "alreadyMinted": false,
  "certificate": null,
  "message": "Congratulations! You've completed the entire curriculum and can now mint your certificate!"
}

Response (Already Minted):
{
  "isEligible": false,
  "curriculumComplete": true,
  "progressPercentage": 100,
  "alreadyMinted": true,
  "certificate": { /* certificate object */ },
  "message": "You have already minted your certificate!"
}

Response (Not Complete):
{
  "isEligible": false,
  "curriculumComplete": false,
  "progressPercentage": 67,
  "alreadyMinted": false,
  "certificate": null,
  "message": "Complete all courses to unlock certificate minting."
}
```

**Frontend Action:**
- Show the `message` to the user
- Enable/disable "Mint Certificate" button based on `isEligible`
- If `alreadyMinted: true`, show existing certificate

### 5. Mint Certificate

```bash
POST /api/v1/certificates/mint
Authorization: Bearer <token>
Content-Type: application/json

{
  "moduleId": 0,  // 0 for overall curriculum certificate
  "score": 100
}

Response (Success):
{
  "id": "uuid",
  "userId": "uuid",
  "moduleId": 0,
  "score": 100,
  "txId": "0x...",
  "nftTokenId": 123,
  "mintedAt": "2024-03-20T10:35:00Z",
  "metadata": {}
}

Response (Error - Not Eligible):
{
  "statusCode": 400,
  "message": "Cannot mint certificate. Curriculum completion: 67%. You must complete all courses (100%) to mint a certificate.",
  "error": "Bad Request"
}

Response (Error - Already Minted):
{
  "statusCode": 400,
  "message": "Certificate already minted for this user. Only one certificate per user is allowed.",
  "error": "Bad Request"
}
```

## Current Curriculum Structure

After removing "Build dApps" and "Build Real World Project", the curriculum now has:

1. **Bitcoin Fundamentals** (6 steps)
   - Bitcoin 101 (2 steps)
   - The Bitcoin Network (2 steps)
   - Proof of Work (1 step)
   - Wallets & Nodes (1 step)

2. **Introduction to Stacks** (4 steps)
   - Basics of Stacks (1 step)
   - Proof of Transfer (1 step)
   - sBTC Overview (1 step)
   - Stacks Architecture (1 step)

3. **Clarity Smart Contracts** (4 steps)
   - Clarity Syntax (2 steps)
   - Built-in Functions (1 step)
   - Deploying Contracts (1 step)

4. **Advanced Smart Contract Patterns** (4 steps)
   - Advanced Methods (1 step)
   - Security Best Practices (1 step)
   - DeFi Implementations (1 step)
   - Performance Profiling (1 step)

**Total: 18 steps across 4 courses**

## Performance Comparison

### ❌ OLD Approach (Multiple API Calls)

```typescript
// Learning path page makes 7 separate calls
const courses = [1, 2, 3, 4, 5, 6, 7];
const progressPromises = courses.map(id => 
  fetch(`/api/v1/courses/${id}/progress`)
);
const results = await Promise.all(progressPromises);

// Database: 7 separate queries
// Network: 7 HTTP requests
// Time: ~700ms (7 × 100ms)
```

### ✅ NEW Approach (Single Optimized Call)

```typescript
// Single call returns all progress data
const summary = await fetch('/api/v1/courses/progress/summary');

// Database: 1 query
// Network: 1 HTTP request  
// Time: ~100ms
// Improvement: 7x faster! 🚀
```

### Benefits

- **7x fewer API calls**: 1 instead of 7
- **7x fewer database queries**: Single query fetches all progress
- **Faster page load**: ~600ms saved on learning path page
- **Reduced server load**: Less CPU and memory usage
- **Better UX**: Instant progress display
- **Easier to maintain**: Single source of truth

## Recommended Frontend Implementation

### On Learning Path Page (OPTIMIZED)

```typescript
// ✅ NEW: Single API call instead of 7
const { data: summary } = await fetch('/api/v1/courses/progress/summary');

// Build progressMap from the response
const progressMap = summary.courses.reduce((map, course) => {
  map[course.courseId] = course.progressPercentage;
  return map;
}, {} as Record<number, number>);

// Show congratulations banner if complete
{summary.overallPercentage === 100 && (
  <div className="bg-green-500 text-white p-4 rounded-lg">
    <h2>🎉 Congratulations!</h2>
    <p>You've completed the entire Stacks Academy curriculum!</p>
    <p>{summary.completedCourses}/{summary.totalCourses} courses completed</p>
    <button onClick={() => router.push('/certificates')}>
      Mint Your Certificate
    </button>
  </div>
)}

// Show progress bar
<ProgressBar 
  value={summary.overallPercentage} 
  max={100}
  label={`${summary.completedSteps}/${summary.totalSteps} steps completed`}
/>

// Render course cards with progress
{courses.map((course, index) => (
  <ModuleCard
    key={course.id}
    course={course}
    progress={progressMap[course.id] || 0}
    state={deriveModuleState(course, progressMap, index, courses)}
  />
))}
```

### Hero Progress Widget (OPTIMIZED)

```typescript
// ✅ NEW: Use the same summary endpoint
const { data: summary } = await fetch('/api/v1/courses/progress/summary');

<div className="hero-widget">
  <h3>Your Progress</h3>
  <ProgressRing percentage={summary.overallPercentage} />
  <p>{summary.completedCourses} of {summary.totalCourses} courses completed</p>
  <p>{summary.completedSteps}/{summary.totalSteps} total steps</p>
</div>
```

### On Certificate Page

```typescript
// Check eligibility
const { data: eligibility } = await fetch('/api/v1/certificates/eligibility');

// Show appropriate UI
{eligibility.isEligible ? (
  <button onClick={handleMint}>
    Mint Certificate NFT
  </button>
) : eligibility.alreadyMinted ? (
  <div>
    <p>Certificate Already Minted!</p>
    <CertificateDisplay certificate={eligibility.certificate} />
  </div>
) : (
  <div>
    <p>{eligibility.message}</p>
    <ProgressBar value={eligibility.progressPercentage} />
  </div>
)}
```

### After Completing a Step

```typescript
const response = await fetch(
  `/api/v1/courses/${courseId}/lessons/${lessonId}/steps/${stepId}/complete`,
  { method: 'POST' }
);

const data = await response.json();

// Show congratulations if curriculum just completed
if (data.curriculumComplete && data.justCompleted) {
  showCongratsModal({
    title: "🎉 Curriculum Complete!",
    message: "You've finished all courses! Ready to mint your certificate?",
    action: () => router.push('/certificates')
  });
}
```

## Testing

### Test Scenario 1: Complete Curriculum

```bash
# Complete all 18 steps
# Then check eligibility
curl -X GET http://localhost:3001/api/v1/certificates/eligibility \
  -H "Authorization: Bearer $TOKEN"

# Should return isEligible: true
```

### Test Scenario 2: Try to Mint Without Completion

```bash
# Complete only 10 steps
# Then try to mint
curl -X POST http://localhost:3001/api/v1/certificates/mint \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"moduleId": 0, "score": 100}'

# Should return 400 error
```

### Test Scenario 3: Try to Mint Twice

```bash
# Complete all steps and mint once
# Then try to mint again
curl -X POST http://localhost:3001/api/v1/certificates/mint \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"moduleId": 0, "score": 100}'

# Should return 400 error: "Certificate already minted"
```

## Database Considerations

- No new tables required
- Uses existing `user_progress` and `certificates` tables
- Certificate minting is one-per-user for the overall curriculum
- `moduleId` in certificate can be 0 to represent "overall curriculum" certificate

## Future Enhancements

1. **Per-Course Certificates**: Allow minting certificates for individual courses
2. **Retry Failed Mints**: Add endpoint to retry NFT minting if blockchain transaction failed
3. **Certificate Metadata**: Store additional metadata (completion date, time taken, etc.)
4. **Leaderboard Integration**: Track fastest completions
5. **Email Notifications**: Send congratulations email when curriculum is complete
6. **XP Bonus**: Award bonus XP for completing entire curriculum

---

**Implementation Date**: March 20, 2024
**Status**: ✅ Complete
