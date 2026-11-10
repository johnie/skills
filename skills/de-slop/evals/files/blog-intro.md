# Why We Moved CI to GitHub Actions

Here's the thing: CI is the heartbeat of any engineering organization. In today's fast-paced landscape, slow pipelines aren't just annoying — they're a tax on every single developer.

Last spring, our Jenkins pipeline took 38 minutes on average. Not because our tests were slow. Because our infrastructure was. Let that sink in.

So we embarked on a journey. Over six weeks, we migrated 14 repositories to GitHub Actions. The results? Truly game-changing. Median build time dropped to 9 minutes, and the flaky `integration-db` job, which probably caused most of our reruns, now passes on the first try.

As our staff engineer Maria put it: "I stopped checking Slack while I waited for builds."

It wasn't easy. It wasn't fast. But it was worth it. And that's the real lesson here.
