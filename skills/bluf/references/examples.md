# Examples

Each example shows the source text, the bottom line that step 1 finds, and the result.

## 1. Pull request description

**Before**

> ## Summary
>
> This PR introduces a comprehensive refactoring of the session handling logic in order to address an issue that was reported where users were being unexpectedly logged out. After investigating the problem, it was discovered that the root cause was related to the way that the token refresh mechanism was handling concurrent requests.
>
> ## Changes
>
> - **`auth/session.ts`**: Updated the `refreshToken()` function to leverage a mutex, ensuring that only one refresh can happen at a time
> - **`auth/session.test.ts`**: Added robust test coverage for the concurrent scenario
> - **`auth/types.ts`**: Minor type updates
>
> ## Benefits
>
> - Improved reliability
> - Better user experience
> - More maintainable code
>
> ## Testing
>
> - [x] Unit tests pass
> - [ ] Manual testing
>
> It's worth noting that this change also modifies the refresh endpoint to return a 409 instead of a 401 when a refresh is already in progress, so clients may need to be updated.
>
> Fixes #482

**Bottom line:** The change stops the unexpected logouts by serializing token refresh. The reviewer must know that the refresh endpoint now returns 409 in one case, which can break clients.

**After**

> Fixes the unexpected logouts in #482. Two concurrent requests could each refresh the session token, and the second refresh made the first token invalid. `refreshToken()` now holds a mutex, so only one refresh runs at a time.
>
> **Breaking:** The refresh endpoint now returns 409, not 401, when a refresh is in progress. Clients that treat only 401 as "try again" must also handle 409.
>
> Tested with a new unit test for concurrent refresh in `auth/session.test.ts`. Not tested manually.

What changed:

- The warning moved from the last paragraph to the second.
- The file list and the "Benefits" section are gone. The diff shows the files, and the benefit is the first sentence.
- "Not tested manually" replaces an empty checkbox. It is the same fact, and the reviewer can now see it.
- The headings are gone. The text is three short paragraphs.

## 2. Status update

**Before**

> Hi team! 👋 Just wanted to give a quick update on where things stand with the search migration. We've been making really solid progress over the past couple of weeks and the team has been working hard on getting the new indexing pipeline up and running. We successfully completed the schema migration and have also finished the work on the query translation layer, which is great news. That said, during load testing we did run into some unexpected challenges with reindexing performance — it's currently taking around 14 hours to do a full reindex, which is quite a bit longer than the 4-hour maintenance window we have available. We're exploring a few different options to address this, including incremental reindexing and potentially requesting a longer window. Given all of this, it's looking like we may not be able to hit the original March 15 date. Let me know if you have any questions or want to discuss!

**Bottom line:** The migration will miss 15 March because a full reindex takes 14 hours and the window is 4 hours. The writer needs a decision between two options.

**After**

> The search migration will not be ready on 15 March. A full reindex takes 14 hours, and the maintenance window is 4 hours.
>
> I need a decision on one of these options:
>
> 1. Build incremental reindexing, so that the reindex fits in the window.
> 2. Ask for a longer maintenance window.
>
> The schema migration and the query translation layer are complete.

What changed:

- The missed date moved from the second-to-last sentence to the first.
- "May not be able to hit" became "will not be ready". The source gives numbers that make it certain, 14 hours against 4. If the source gave no such numbers, the uncertainty would stay.
- "We're exploring a few options" became a request for a decision, because the source names two options and a blocked date. If you are not sure that the writer wants a decision, ask them.
- The source gives no estimate for option 1 and no new date. The result does not invent them. Add a note to the user: "The update gives no new date and no estimate for incremental reindexing. The reader will ask for both."

## 3. Chat message

**Before**

> Hey Jim, hope you're doing well! So over the course of working on the new billing project we've run into some challenges with the data. When we try to take the invoices table from the Oracle database and load it into SQL Server we're getting an error. We've tried a couple of approaches we found online but nothing seems to work so far. Do you have any experience with this kind of data transfer? If not, do you know anyone who might?

**After**

> Jim, do you know who can help us move a table from Oracle to SQL Server? The load of the `invoices` table fails with an error, and the two methods we tried did not fix it. This blocks the billing project.

Add a note to the user: "The message does not give the error text. Paste the exact error, so that Jim can answer in one reply."

## 4. Commit message

**Before**

> ```text
> fix: update the user service to improve error handling
>
> This commit makes several improvements to the way that errors are handled
> in the user service. Previously, when the database connection was lost,
> the service would crash. Now, proper error handling has been implemented
> to ensure that the service handles this gracefully by catching the
> exception and returning a 503 status code to the client. This makes the
> service more robust and improves the overall reliability of the system.
> ```

**After**

> ```text
> fix: return 503 when the user service loses its database
>
> The service crashed when the database connection dropped. It now
> catches the connection error and returns 503, so that clients can
> try again.
> ```

Note: "so that clients can try again" is in the result only because 503 means "try again later". It adds no new fact. If you are not sure that a clause adds no fact, omit it.

## 5. Instructions

**Before**

> To get started, you'll first want to make sure you have Node 20 or later installed, after which you can go ahead and clone the repo and install dependencies by running `npm install`, and then you should copy the `.env.example` file to `.env` and fill in your API key before finally starting the dev server with `npm run dev`, keeping in mind that the server won't start if the API key is missing.

**After**

> You must have Node 20 or later.
>
> 1. Clone the repository.
> 2. Install the dependencies:
>    ```bash
>    npm install
>    ```
> 3. Copy `.env.example` to `.env`.
> 4. Set your API key in `.env`. The server does not start if the key is missing.
> 5. Start the development server:
>    ```bash
>    npm run dev
>    ```

## 6. Text with no bottom line

**Before**

> We looked into the performance of the dashboard and there are a number of factors at play. The queries could potentially be optimized, and there may also be some opportunities around caching. The frontend bundle is also fairly large. There are various trade-offs to consider with each approach.

Do not rewrite this text. It has no finding, no recommendation, and no request. A shorter version is still empty.

Answer the user:

> This text has no bottom line. It names three possible causes (queries, caching, bundle size) and gives no measurement, no recommendation, and no request. Tell me which of these you want to say:
>
> - What you measured, and which cause is the largest.
> - What you recommend to do first.
> - What you need from the reader.
