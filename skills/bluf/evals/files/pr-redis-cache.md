## 🚀 Overview

This pull request implements a robust and comprehensive caching layer for the article recommendation service, leveraging Redis to significantly enhance performance and deliver a seamless experience for end users.

## 🔍 Background

Previously, every request to `/api/recommendations` would trigger a full recomputation of the recommendation model scoring, which was identified as a major bottleneck during profiling. After careful analysis, it was determined that the results for a given user rarely change within a short time window, making this an ideal candidate for caching.

## ✨ Key Changes

- **`RecommendationService.ts`**: Introduced a cache-aside pattern, checking Redis before invoking the scoring pipeline
- **`redisClient.ts`**: Added a new Redis client wrapper with connection pooling and graceful error handling
- **`config/default.yaml`**: Added `RECS_CACHE_TTL_SECONDS` (defaults to 300)
- **`RecommendationService.test.ts`**: Added comprehensive unit tests covering cache hits, misses, and Redis failures

## 📈 Performance Impact

In local benchmarking, p95 latency dropped from ~900ms to ~45ms for cached requests. This should translate to meaningful improvements in production, though actual results may vary.

## ⚠️ Considerations

- It's worth noting that users may see stale recommendations for up to 5 minutes after reading an article, since we're not invalidating on read events yet
- The service now requires `REDIS_URL` to be set; if Redis is unreachable the service falls back to computing directly, ensuring resilience
- A follow-up could explore event-driven invalidation

## ✅ Testing

- [x] Unit tests
- [x] Local benchmark
- [ ] Staging

Closes NEWS-2291
