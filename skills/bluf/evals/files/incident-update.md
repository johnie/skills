Hi everyone, I wanted to provide a comprehensive update regarding the intermittent login failures that some of our users have been experiencing since yesterday afternoon.

Our team has been diligently investigating this issue and we've made meaningful progress in understanding what's going on. Initially, we suspected that the problem might be related to the recent deployment of the auth-gateway (v2.14.0), and we rolled that back at around 16:40 yesterday. Unfortunately, the rollback did not resolve the issue, which suggests the deployment was likely not the root cause.

Upon further investigation, we noticed that the failures appear to correlate with elevated latency on the identity-db read replica in eu-north-1 — it's possible that replication lag is causing freshly created sessions to not be found when the validation request hits the replica, although we haven't been able to fully confirm this hypothesis yet. Roughly 3% of login attempts are currently failing, and a retry typically succeeds.

As a potential mitigation, we could route session validation reads to the primary, but this would increase load on the primary by an estimated 20–25%, and we'd want the DBA team to weigh in on whether that's safe before proceeding. @dba-oncall it would be great if you could take a look when you get a chance.

We'll continue to monitor the situation closely and will provide further updates as they become available. Thanks for your patience!
