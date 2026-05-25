# Reviews API — Storefront Consumer Reference

> **Base URL:** `https://us-central1-apx-eplus-progressive-discount.cloudfunctions.net/app`
>
> All endpoints are **public** — no authentication required.  
> All responses are `application/json`.

---

## Use-case overview

| Page | Endpoint | Purpose |
|---|---|---|
| Product listing | `GET /reviews/ratings` | Batch average + total for up to 300 products at once |
| Product detail | `GET /reviews/list` | Paginated reviews + full summary (average, totals, rating breakdown, recommended counts) |

---

## 1. `GET /reviews/ratings`

Returns average rating and total approved reviews for **multiple products at once**. Designed for product listing pages where you need to render star widgets efficiently.

### Query parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `store_id` | number | ✅ | Numeric store ID |
| `product_ids` | string | ✅ | Comma-separated list of product `_id` values (max 300) |

### Request example

```
GET /reviews/ratings?store_id=51629&product_ids=a1b2c3d4e5f6,9f8e7d6c5b4a,1a2b3c4d5e6f
```

### Response

```json
{
  "ratings": {
    "a1b2c3d4e5f6": {
      "average": 4.5,
      "total": 12,
      "ratingCounts": {
        "1": 0,
        "2": 1,
        "3": 1,
        "4": 4,
        "5": 6
      }
    },
    "9f8e7d6c5b4a": {
      "average": 3.8,
      "total": 5,
      "ratingCounts": {
        "1": 0,
        "2": 0,
        "3": 3,
        "4": 1,
        "5": 1
      }
    }
  }
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `ratings` | object | Keys are `product_id` strings |
| `ratings[id].average` | number | Average rating rounded to 1 decimal place (e.g. `4.5`) |
| `ratings[id].total` | number | Total number of approved reviews |
| `ratings[id].ratingCounts` | object | Count per star level (`"1"` through `"5"`) |

> **Note:** Products with **zero approved reviews are omitted** from the response object. Always check `ratings[productId]` for existence before rendering.

### Caching

The response includes `Cache-Control: public, max-age=300` (5 minutes). Honour this header to reduce latency and cost.

### Error codes

| HTTP | `error` | Cause |
|---|---|---|
| 400 | `MISSING_PARAMS` | `product_ids` or `store_id` not provided |
| 400 | `INVALID_STORE_ID` | `store_id` is not a valid number |
| 400 | `NO_PRODUCT_IDS` | `product_ids` is empty after parsing |
| 500 | `FIRESTORE_ERROR` | Internal database error |

---

## 2. `GET /reviews/list`

Returns a **paginated list of approved reviews** for a single product, along with a full summary. Use on product detail pages.

### Query parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `store_id` | number | ✅ | — | Numeric store ID |
| `product_id` | string | ✅ | — | E-Com Plus product `_id` |
| `page` | number | ❌ | `1` | Page number (1-based) |
| `limit` | number | ❌ | `20` | Reviews per page (max `100`) |

### Request example

```
GET /reviews/list?store_id=51629&product_id=a1b2c3d4e5f6&page=1&limit=10
```

### Response

```json
{
  "reviews": [
    {
      "id": "51629_abc123_a1b2c3d4e5f6",
      "rating": 5,
      "recommended": true,
      "text": "Excellent product, arrived quickly.",
      "photos": [
        "https://firebasestorage.googleapis.com/v0/b/apx-eplus-progressive-discount.firebasestorage.app/o/reviews%2F51629%2F1716300000000_x7k2m.jpg?alt=media"
      ],
      "customerName": "Maria S.",
      "createdAt": "2026-05-15T10:32:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 47
  },
  "summary": {
    "averageRating": 4.3,
    "totalReviews": 47,
    "ratingCounts": {
      "1": 2,
      "2": 3,
      "3": 5,
      "4": 15,
      "5": 22
    },
    "recommendedCounts": {
      "yes": 39,
      "no": 6
    }
  }
}
```

### Response fields — `reviews[]`

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique review document ID |
| `rating` | number | Star rating, `1`–`5` |
| `recommended` | boolean | Whether the customer recommends the product |
| `text` | string \| null | Review body text (up to 2 000 chars), `null` if not provided |
| `photos` | string[] | Public URLs of uploaded images/videos (may be empty) |
| `customerName` | string \| null | Customer display name, `null` if not available |
| `createdAt` | string \| null | ISO 8601 UTC timestamp |

### Response fields — `pagination`

| Field | Type | Description |
|---|---|---|
| `page` | number | Current page number |
| `limit` | number | Reviews per page as requested |
| `total` | number | Total approved reviews for this product |

### Response fields — `summary`

| Field | Type | Description |
|---|---|---|
| `averageRating` | number \| null | Average rating rounded to 1 decimal (`null` if no reviews) |
| `totalReviews` | number | Total approved reviews |
| `ratingCounts` | object | Count per star level, keys `"1"` through `"5"` |
| `recommendedCounts.yes` | number | Reviews where `recommended === true` |
| `recommendedCounts.no` | number | Reviews where `recommended === false` |

> **Note:** `summary` aggregates **all approved reviews** for the product, not just the current page. Use it for the star widget and recommendation bar regardless of which page is loaded.

### Error codes

| HTTP | `error` | Cause |
|---|---|---|
| 400 | `MISSING_PARAMS` | `product_id` or `store_id` not provided |
| 500 | `FIRESTORE_ERROR` | Internal database error |

---

## Recommended rendering logic

### Product listing — star widget

```js
const { ratings } = await fetch(
  `${BASE_URL}/reviews/ratings?store_id=${storeId}&product_ids=${productIds.join(',')}`
).then(r => r.json())

for (const product of products) {
  const stats = ratings[product._id]
  if (stats) {
    renderStars(product, stats.average, stats.total)
  }
}
```

### Product detail — reviews section

```js
const data = await fetch(
  `${BASE_URL}/reviews/list?store_id=${storeId}&product_id=${productId}&page=${page}&limit=10`
).then(r => r.json())

const { summary, reviews, pagination } = data

// Summary widgets
renderStarAverage(summary.averageRating, summary.totalReviews)
renderRatingBreakdown(summary.ratingCounts)
renderRecommendedBar(summary.recommendedCounts.yes, summary.recommendedCounts.no)

// Review list
renderReviewCards(reviews)
renderPagination(pagination)
```
