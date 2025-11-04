# SlotSwapper API - Postman Collection

This document describes how to test the SlotSwapper API using the endpoints.

## Base URL
```
http://localhost:5000/api
```

## Authentication

All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Postman Collection JSON

You can import this collection into Postman:

```json
{
  "info": {
    "name": "SlotSwapper API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Signup",
          "request": {
            "method": "POST",
            "header": [{"key": "Content-Type", "value": "application/json"}],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"name\": \"John Doe\",\n  \"email\": \"john@example.com\",\n  \"password\": \"password123\"\n}"
            },
            "url": {"raw": "{{baseUrl}}/auth/signup"}
          }
        },
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "header": [{"key": "Content-Type", "value": "application/json"}],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"john@example.com\",\n  \"password\": \"password123\"\n}"
            },
            "url": {"raw": "{{baseUrl}}/auth/login"}
          }
        },
        {
          "name": "Get Me",
          "request": {
            "method": "GET",
            "header": [{"key": "Authorization", "value": "Bearer {{token}}"}],
            "url": {"raw": "{{baseUrl}}/auth/me"}
          }
        }
      ]
    },
    {
      "name": "Events",
      "item": [
        {
          "name": "Get My Events",
          "request": {
            "method": "GET",
            "header": [{"key": "Authorization", "value": "Bearer {{token}}"}],
            "url": {"raw": "{{baseUrl}}/events"}
          }
        },
        {
          "name": "Create Event",
          "request": {
            "method": "POST",
            "header": [
              {"key": "Content-Type", "value": "application/json"},
              {"key": "Authorization", "value": "Bearer {{token}}"}
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"title\": \"Team Meeting\",\n  \"startTime\": \"2025-01-15T10:00:00Z\",\n  \"endTime\": \"2025-01-15T11:00:00Z\",\n  \"status\": \"BUSY\"\n}"
            },
            "url": {"raw": "{{baseUrl}}/events"}
          }
        },
        {
          "name": "Update Event",
          "request": {
            "method": "PUT",
            "header": [
              {"key": "Content-Type", "value": "application/json"},
              {"key": "Authorization", "value": "Bearer {{token}}"}
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"status\": \"SWAPPABLE\"\n}"
            },
            "url": {"raw": "{{baseUrl}}/events/:eventId"}
          }
        },
        {
          "name": "Delete Event",
          "request": {
            "method": "DELETE",
            "header": [{"key": "Authorization", "value": "Bearer {{token}}"}],
            "url": {"raw": "{{baseUrl}}/events/:eventId"}
          }
        }
      ]
    },
    {
      "name": "Swap",
      "item": [
        {
          "name": "Get Swappable Slots",
          "request": {
            "method": "GET",
            "header": [{"key": "Authorization", "value": "Bearer {{token}}"}],
            "url": {"raw": "{{baseUrl}}/swap/swappable-slots"}
          }
        },
        {
          "name": "Create Swap Request",
          "request": {
            "method": "POST",
            "header": [
              {"key": "Content-Type", "value": "application/json"},
              {"key": "Authorization", "value": "Bearer {{token}}"}
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"mySlotId\": \"507f1f77bcf86cd799439011\",\n  \"theirSlotId\": \"507f1f77bcf86cd799439012\"\n}"
            },
            "url": {"raw": "{{baseUrl}}/swap/swap-request"}
          }
        },
        {
          "name": "Respond to Swap",
          "request": {
            "method": "POST",
            "header": [
              {"key": "Content-Type", "value": "application/json"},
              {"key": "Authorization", "value": "Bearer {{token}}"}
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"accepted\": true\n}"
            },
            "url": {"raw": "{{baseUrl}}/swap/swap-response/:requestId"}
          }
        },
        {
          "name": "Get Incoming Requests",
          "request": {
            "method": "GET",
            "header": [{"key": "Authorization", "value": "Bearer {{token}}"}],
            "url": {"raw": "{{baseUrl}}/swap/incoming-requests"}
          }
        },
        {
          "name": "Get Outgoing Requests",
          "request": {
            "method": "GET",
            "header": [{"key": "Authorization", "value": "Bearer {{token}}"}],
            "url": {"raw": "{{baseUrl}}/swap/outgoing-requests"}
          }
        }
      ]
    }
  ],
  "variable": [
    {"key": "baseUrl", "value": "http://localhost:5000/api"},
    {"key": "token", "value": ""}
  ]
}
```

## Testing Workflow

1. **Signup/Login**: Get your JWT token
2. **Set Token**: Copy the token from response and set it in the `token` variable
3. **Create Events**: Create some events and mark them as SWAPPABLE
4. **View Marketplace**: Get swappable slots from other users
5. **Create Swap Request**: Request to swap with someone's slot
6. **Respond to Swap**: Accept or reject incoming requests
