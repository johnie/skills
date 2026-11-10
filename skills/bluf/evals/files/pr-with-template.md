## What

This PR introduces a number of important changes to the way that the notification preferences page handles saving. It refactors the form submission logic, enhances the validation, and also updates the underlying API call in order to provide a more seamless and reliable experience for users who are managing their notification settings.

## Why

It was reported in SUP-771 that users were occasionally losing their notification preferences. After a thorough investigation into the root cause, it was ultimately determined that when a user toggled two switches in quick succession, two separate PATCH requests were being fired off, and since each of them was sending the complete preferences object based on stale local state, the second request would end up overwriting the change from the first one. The fix that has been implemented here is to debounce the save by 400ms and to send only the changed field rather than the whole object.

## How to test

In order to verify this change, you'll want to first navigate to Settings → Notifications, then proceed to rapidly toggle "Email digest" and "Push: breaking news" one right after the other, and after that reload the page, at which point both of the changes should have been persisted correctly.

## Screenshots

N/A

## Checklist

- [x] Tests added
- [x] No new lint warnings
- [ ] Docs updated (not needed)

## Notes for reviewers

It's probably worth mentioning that the PATCH endpoint previously accepted a full object and this PR changes the web client to send partial objects. The backend already supports partial updates (see `PreferencesController.patch`), but the iOS and Android apps still send the full object, so they can still hit the same overwrite bug until they are updated as well. That is being tracked separately in MOB-455.
