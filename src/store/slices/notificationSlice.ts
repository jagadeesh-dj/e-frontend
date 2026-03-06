import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  read: boolean
  createdAt: string
}

interface NotificationState {
  items: Notification[]
  unreadCount: number
}

const initialState: NotificationState = {
  items: [
    {
      id: '1',
      type: 'success',
      title: 'Order Placed',
      message: 'Your order #ORD-001 has been placed successfully',
      read: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      type: 'info',
      title: 'New Arrivals',
      message: 'Check out our new summer collection',
      read: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: '3',
      type: 'success',
      title: 'Order Delivered',
      message: 'Your order #ORD-001 has been delivered',
      read: true,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ],
  unreadCount: 2,
}

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id' | 'createdAt' | 'read'>>) => {
      const newNotification: Notification = {
        ...action.payload,
        id: Date.now().toString(),
        read: false,
        createdAt: new Date().toISOString(),
      }
      state.items.unshift(newNotification)
      state.unreadCount += 1
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.items.find(n => n.id === action.payload)
      if (notification && !notification.read) {
        notification.read = true
        state.unreadCount -= 1
      }
    },
    markAllAsRead: (state) => {
      state.items.forEach(n => n.read = true)
      state.unreadCount = 0
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      const index = state.items.findIndex(n => n.id === action.payload)
      if (index > -1) {
        if (!state.items[index].read) {
          state.unreadCount -= 1
        }
        state.items.splice(index, 1)
      }
    },
    clearAllNotifications: (state) => {
      state.items = []
      state.unreadCount = 0
    },
  },
})

export const { addNotification, markAsRead, markAllAsRead, removeNotification, clearAllNotifications } = notificationSlice.actions
export default notificationSlice.reducer
