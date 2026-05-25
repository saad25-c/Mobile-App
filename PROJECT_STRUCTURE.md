# 📁 Structure du Projet - Notifications Frontend

## Vue d'Ensemble

```
EcoleApp/
├── README.md
├── NOTIFICATIONS_FRONTEND_DOCS.md ............ Documentation technique
├── IMPLEMENTATION_SUMMARY.md ............... Résumé visuel
├── EXAMPLES_AND_USAGE.md ................... Exemples et cas d'usage
├── INTEGRATION_CHECKLIST.md ................ Checklist d'intégration
├── PROJECT_STRUCTURE.md ................... Ce fichier
│
├── apps/
│   ├── MonNouveauProjet/ ................. 👨‍👩‍👧 Parents/Students
│   │   ├── app/
│   │   │   ├── (parent)/
│   │   │   │   └── notifications.jsx .... ✅ [UPDATED] Page notifications
│   │   │   └── ...
│   │   ├── hooks/
│   │   │   ├── useStudentParentNotifications.js ... ✅ [NEW] Custom hook
│   │   │   └── ...
│   │   ├── services/
│   │   │   ├── api.js .................. ✅ [UPDATED] +2 endpoints
│   │   │   └── ...
│   │   └── ...
│   │
│   └── test_prof/ ....................... 👨‍🏫 Teachers
│       ├── app/
│       │   └── (tabs)/
│       │       ├── notifications.jsx ... ✅ [NEW] Page notifications
│       │       ├── _layout.jsx ........ ✅ [UPDATED] +Notifications tab
│       │       └── ...
│       ├── services/
│       │   ├── api.js ................ ✅ [UPDATED] +5 endpoints
│       │   └── ...
│       └── ...
│
└── package.json
```

---

## 📂 Arborescence Détaillée

### 1️⃣ Teachers App (test_prof)

```
test_prof/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.jsx
│   │   │   ├── Tabs Configuration
│   │   │   ├── index ..................... Home
│   │   │   ├── planning .................. Planning
│   │   │   ├── absences .................. Absences
│   │   │   ├── disponibilites ........... Availability
│   │   │   ├── notifications ............ 🆕 NEW ← Notifications Page
│   │   │   └── profil .................... Profile
│   │   │
│   │   ├── index.jsx .................... Home page
│   │   ├── planning.jsx ................. Planning page
│   │   ├── absences.jsx ................. Absences page
│   │   ├── disponibilites.jsx ........... Dispos page
│   │   ├── notifications.jsx ............ 🆕 NEW NOTIFICATIONS PAGE
│   │   └── profil.jsx ................... Profile page
│   │
│   ├── _layout.jsx ...................... Root layout
│   └── login.jsx ........................ Login page
│
├── services/
│   └── api.js
│       ├── fetchLessons() ............... Existing
│       ├── fetchAbsences() .............. Existing
│       ├── declareAbsence() ............. Existing
│       ├── fetchNotifications() ......... 🆕 NEW
│       ├── markNotificationAsRead() .... 🆕 NEW
│       ├── markAllNotificationsAsRead() 🆕 NEW
│       ├── deleteNotification() ........ 🆕 NEW
│       └── deleteAllNotifications() ... 🆕 NEW
│
├── store/
│   └── authStore.js
│
├── constants/
│   └── api.js
│
└── package.json
```

### 2️⃣ Parents/Students App (MonNouveauProjet)

```
MonNouveauProjet/
├── app/
│   ├── (parent)/
│   │   ├── _layout.jsx
│   │   ├── dashboard.jsx
│   │   ├── documents.jsx
│   │   ├── finances.jsx
│   │   ├── notes.jsx
│   │   ├── planning.jsx
│   │   ├── notifications.jsx ........... 🆕 UPDATED NOTIFICATIONS PAGE
│   │   └── presences.jsx
│   │
│   ├── (student)/
│   │   └── ...
│   │
│   ├── (tabs)/
│   │   └── ...
│   │
│   ├── _layout.jsx ...................... Root layout
│   └── login.jsx ........................ Login page
│
├── hooks/
│   ├── useStudentParentNotifications.js  🆕 NEW CUSTOM HOOK
│   ├── useNotifications.js .............. Existing (cancelled lessons)
│   ├── useProfilePhoto.js ............... Existing
│   └── ...
│
├── services/
│   └── api.js
│       ├── getNotifications() ........... Existing
│       ├── getUnreadCount() ............. Existing
│       ├── markAllNotificationsRead() ... Existing
│       ├── markNotificationRead() ....... 🆕 NEW
│       ├── deleteNotification() ......... Existing
│       └── deleteAllNotifications() ... 🆕 NEW
│
├── components/
│   └── ui/
│       ├── ScreenHeader.jsx
│       ├── LoadingScreen.jsx
│       ├── EmptyState.jsx
│       └── ...
│
├── context/
│   └── NotificationContext.js
│
├── store/
│   └── authStore.js
│
└── package.json
```

---

## 🔄 Flux de Données

### Teachers Notification Flow

```
┌─────────────────────────────────────────────────────────┐
│ Page: app/(tabs)/notifications.jsx                      │
│                                                           │
│ States:                                                   │
│ ├─ notifications: []                                     │
│ ├─ loading: boolean                                      │
│ ├─ unreadCount: number                                   │
│ ├─ selectedStatus: 'all'|'true'|'false'                │
│ └─ showClearConfirm: boolean                            │
│                                                           │
│ Effects:                                                  │
│ ├─ Load notifications on mount                           │
│ └─ Auto-refresh every 30s                                │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ Services: services/api.js                               │
│                                                           │
│ Functions:                                               │
│ ├─ fetchNotifications(token, {page, limit, isRead})    │
│ ├─ markNotificationAsRead(token, id)                   │
│ ├─ markAllNotificationsAsRead(token)                   │
│ ├─ deleteNotification(token, id)                       │
│ └─ deleteAllNotifications(token)                       │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ Backend API: /api/notifications/...                     │
│                                                           │
│ Endpoints:                                               │
│ ├─ GET /api/notifications                              │
│ ├─ PATCH /api/notifications/{id}/mark-read            │
│ ├─ PATCH /api/notifications/mark-read                 │
│ ├─ DELETE /api/notifications/{id}                      │
│ └─ DELETE /api/notifications/all                       │
└─────────────────────────────────────────────────────────┘
```

### Parents/Students Notification Flow

```
┌────────────────────────────────────────────────────────────┐
│ Page: app/(parent)/notifications.jsx                       │
│                                                              │
│ Uses Hook: useStudentParentNotifications()                  │
│                                                              │
│ Hook States:                                                │
│ ├─ notifications: []                                        │
│ ├─ loading: boolean                                         │
│ ├─ refreshing: boolean                                      │
│ ├─ unreadCount: number                                      │
│ └─ total: number                                            │
│                                                              │
│ Hook Methods:                                               │
│ ├─ fetchNotifications(pageNum)                              │
│ ├─ markAsRead(notificationId)                               │
│ ├─ deleteNotif(notificationId)                              │
│ ├─ refresh()                                                │
│ └─ markAllAsRead()                                          │
└──────────────────┬───────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────────┐
│ Services: services/api.js                                  │
│                                                              │
│ Functions:                                                  │
│ ├─ getNotifications(params)                                 │
│ ├─ markAllNotificationsRead()                               │
│ ├─ markNotificationRead(id) ........... 🆕 NEW             │
│ ├─ deleteNotification(id)                                   │
│ └─ deleteAllNotifications() ........... 🆕 NEW             │
└──────────────────┬───────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────────┐
│ Backend API: /api/notifications/...                        │
│                                                              │
│ Endpoints:                                                  │
│ ├─ GET /api/notifications                                 │
│ ├─ GET /api/notifications/unread-count                    │
│ ├─ PATCH /api/notifications/mark-read                    │
│ ├─ PATCH /api/notifications/mark-all-read                │
│ ├─ DELETE /api/notifications/{id}                         │
│ └─ DELETE /api/notifications/all                          │
└────────────────────────────────────────────────────────────┘
```

---

## 🎨 Component Architecture

### NotificationCard Component (Teachers)

```
NotificationCard
│
├─ Icon Container
│  └─ Ionicons [getConfig(type).icon]
│
├─ Content Container
│  ├─ Title [notification.title]
│  ├─ Message [notification.message]
│  ├─ Data Details
│  │  ├─ ABSENCE_APPROVED
│  │  │  └─ absenceId
│  │  │
│  │  └─ REPLACEMENT_ASSIGNED
│  │     ├─ lessonId
│  │     └─ absenceId
│  │
│  └─ Timestamp [formatDate(createdAt)]
│
└─ Actions Container
   ├─ Mark as Read [if !isRead]
   ├─ Delete [trash icon]
   └─ Unread Indicator [red dot if !isRead]
```

### NotificationCard Component (Parents/Students)

```
NotificationCard
│
├─ Icon Container
│  └─ Ionicons [getConfig(type).icon]
│
├─ Content Container
│  ├─ Title [notification.title]
│  ├─ Message [notification.message]
│  ├─ Data Details
│  │  ├─ GRADE_PUBLISHED
│  │  │  └─ value/maxValue
│  │  │
│  │  └─ TEACHER_ABSENCE
│  │     └─ lessonId
│  │
│  └─ Timestamp [formatDate(createdAt)]
│
└─ Actions Container
   ├─ Mark as Read [if !isRead]
   ├─ Delete [trash icon]
   └─ Unread Indicator [colored dot if !isRead]
```

---

## 🔗 Integration Points

### Teachers Integration
```
test_prof App
│
├─ App Layout
│  └─ (tabs) Layout
│     ├─ Navigation Tabs
│     │  ├─ Home
│     │  ├─ Planning
│     │  ├─ Absences
│     │  ├─ Dispos
│     │  ├─ 🆕 Notifications ← NEW
│     │  └─ Profile
│     │
│     └─ Tab Screens
│        └─ notifications.jsx ← Uses services/api.js
│
└─ Services
   └─ api.js ← New notification endpoints
```

### Parents/Students Integration
```
MonNouveauProjet App
│
├─ App Layout
│  └─ (parent) Directory
│     ├─ notifications.jsx ← Uses useStudentParentNotifications hook
│     │                      ← Uses services/api.js
│     │
│     └─ Other pages
│
├─ Hooks
│  └─ useStudentParentNotifications.js ← NEW
│     └─ Uses services/api.js
│
└─ Services
   └─ api.js ← New + Updated endpoints
```

---

## 📊 State Management Pattern

### Teachers (Direct State)
```javascript
const [notifications, setNotifications] = useState([]);
const [loading, setLoading] = useState(true);
const [unreadCount, setUnreadCount] = useState(0);
const [selectedStatus, setSelectedStatus] = useState('all');
// ... more state
```

### Parents/Students (Custom Hook)
```javascript
const {
  notifications,      // from hook
  loading,           // from hook
  refreshing,        // from hook
  unreadCount,       // from hook
  markAsRead,        // from hook
  deleteNotif,       // from hook
  refresh,           // from hook
  markAllAsRead      // from hook
} = useStudentParentNotifications();
```

---

## 🎯 API Response Mapping

### GET /api/notifications Response
```json
{
  "success": true,
  "data": [                    ← setNotifications()
    {
      "id": "uuid",
      "userType": "TEACHER",
      "type": "ABSENCE_APPROVED",
      "title": "...",
      "message": "...",
      "data": { ... },
      "isRead": false,
      "createdAt": "...",
      "readAt": null
    }
  ],
  "pagination": {             ← setTotal(), setHasNext()
    "page": 1,
    "limit": 20,
    "total": 5,
    "hasNext": false
  },
  "unreadCount": 3           ← setUnreadCount()
}
```

---

## 🔐 Authentication Flow

```
All Requests (Teachers)
│
├─ Get Token
│  └─ from useAuth() hook
│
├─ Add to Headers
│  └─ Authorization: Bearer {token}
│
└─ Send to API
   └─ POST/PATCH/DELETE /api/notifications/...

All Requests (Parents/Students)
│
├─ Get Token
│  └─ from AsyncStorage
│
├─ Add to Headers
│  └─ Authorization: Bearer {token}
│
└─ Send to API
   └─ GET/PATCH/DELETE /api/notifications/...
```

---

## 📋 File Dependencies

### Teachers (test_prof)
```
notifications.jsx
├─ imports: React, react-native
├─ imports: @expo/vector-icons
├─ imports: useAuth [from ../store/authStore]
├─ imports: fetchNotifications [from ../services/api]
├─ imports: markNotificationAsRead [from ../services/api]
├─ imports: markAllNotificationsAsRead [from ../services/api]
├─ imports: deleteNotification [from ../services/api]
└─ imports: deleteAllNotifications [from ../services/api]

api.js
├─ depends on: const headers(token) helper
├─ depends on: API_URL [from ../constants/api]
└─ depends on: fetch() native
```

### Parents/Students (MonNouveauProjet)
```
notifications.jsx
├─ imports: React, react-native
├─ imports: @expo/vector-icons
├─ imports: useStudentParentNotifications [from @/hooks]
├─ imports: deleteAllNotifications [from @/services/api]
├─ imports: ScreenHeader [from @/components/ui]
├─ imports: LoadingScreen [from @/components/ui]
└─ imports: EmptyState [from @/components/ui]

useStudentParentNotifications.js
├─ imports: useState, useEffect, useRef, useCallback from react
├─ imports: getNotifications [from @/services/api]
├─ imports: markAllNotificationsRead [from @/services/api]
└─ imports: deleteNotification [from @/services/api]

api.js
├─ depends on: AsyncStorage [from @react-native-async-storage]
├─ depends on: getToken() helper
└─ depends on: fetch() native
```

---

## 🚀 Performance Considerations

### Pagination
- Limit: 20 notifications per page
- Teachers: explicit pagination with buttons
- Parents/Students: auto-scroll or manual load more

### Auto-Refresh
- Interval: 30 seconds
- Stops on unmount or when navigation changes
- Only refreshes active page

### Memoization
- Custom hook uses useCallback for stable references
- Component uses React.memo for NotificationCard (recommended)

---

## 🧪 Testing Structure

```
test_prof/
├─ app/(tabs)/notifications.jsx
│  └─ Test scenarios:
│     ├─ Load notifications
│     ├─ Filter by status
│     ├─ Mark as read (single/all)
│     ├─ Delete (single/all)
│     ├─ Auto-refresh
│     └─ Empty state
│
└─ services/api.js
   └─ Test API calls:
      ├─ fetchNotifications()
      ├─ markNotificationAsRead()
      ├─ markAllNotificationsAsRead()
      ├─ deleteNotification()
      └─ deleteAllNotifications()
```

---

## 📚 Documentation Files

```
Root/
├─ NOTIFICATIONS_FRONTEND_DOCS.md
│  └─ Technical documentation
│     ├─ Architecture
│     ├─ Features
│     ├─ API Integration
│     └─ Design Details
│
├─ IMPLEMENTATION_SUMMARY.md
│  └─ Visual summary
│     ├─ Implementation by role
│     ├─ Architecture overview
│     ├─ API response format
│     └─ Future improvements
│
├─ EXAMPLES_AND_USAGE.md
│  └─ Code examples
│     ├─ API responses
│     ├─ Component integration
│     ├─ UI customization
│     └─ Advanced use cases
│
└─ INTEGRATION_CHECKLIST.md
   └─ Implementation checklist
      ├─ Tasks by section
      ├─ Quality metrics
      └─ Completion status
```

---

## ✅ Summary

Cette structure fournit:
- ✅ Clear separation of concerns
- ✅ Reusable components and hooks
- ✅ Scalable architecture
- ✅ Easy to test and maintain
- ✅ Well-documented codebase
- ✅ Consistent with existing patterns
- ✅ Performance optimized
- ✅ Ready for production

