export const PROMPTS = {
  SHORT: `You are a professional meeting note-taker. Summarize the following meeting transcript in exactly 5 bullet points.

Format:
- [Point 1]: [description]
- [Point 2]: [description]
...

Keep each point under 15 words.

TRANSCRIPT:
{transcript}`,

  MEDIUM: `You are a professional meeting summarizer. Create a concise summary of this meeting.

Format:
## Key Discussion Points
- [Point 1]
- [Point 2]
- [Point 3]

## Decisions Made
- [Decision 1]
- [Decision 2]

## Action Items
- [Owner]: [Task] (Due: [Date if mentioned])

TRANSCRIPT:
{transcript}`,

  DETAILED: `You are a professional meeting minutes taker. Create detailed meeting minutes.

Format:
## Meeting Details
- Date: [inferred]
- Duration: [calculated]
- Attendees: [inferred from speaker count]

## Agenda & Discussion
[Chronological breakdown by topic]

## Key Decisions
[Numbered list with context]

## Action Items
- [Owner]: [Task] - [Details]

## Risks & Concerns Identified
[If any]

## Follow-up Meetings Scheduled
[If mentioned]

TRANSCRIPT:
{transcript}`
};
