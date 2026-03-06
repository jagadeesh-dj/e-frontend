import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { User, LoginRequest, RegisterRequest, TokenResponse, Address, ApiResponse, UserProfile } from '../../types'
import api from '../../services/api'
import { handleApiError, handleApiSuccess } from '../../utils/apiErrorHandler'
import { AppDispatch } from '../../store'

interface AuthState {
  user: User | null
  profile: UserProfile | null
  addresses: Address[]
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  profileLoading: boolean
  error: string | null
}

const initialState: AuthState = {
  user: null,
  profile: null,
  addresses: [],
  token: localStorage.getItem('access_token'),
  refreshToken: localStorage.getItem('refresh_token'),
  isAuthenticated: !!localStorage.getItem('access_token'),
  isLoading: false,
  profileLoading: false,
  error: null,
}

export const login = createAsyncThunk<{ user: User; access_token: string; refresh_token: string }, LoginRequest>(
  'auth/login',
  async (credentials, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.post<ApiResponse<TokenResponse>>('/auth/login', credentials)
      const tokenData = response.data.data!
      const access_token = tokenData.access_token
      const refresh_token = tokenData.refresh_token || ''
      
      localStorage.setItem('access_token', access_token)
      localStorage.setItem('refresh_token', refresh_token)
      
      const userResponse = await api.get<ApiResponse<User>>('/users/me')
      const user = userResponse.data.data!
      
      handleApiSuccess(dispatch as AppDispatch, 'Welcome back!', response.data.message || 'You have been logged in successfully')
      
      return { user, access_token, refresh_token }
    } catch (error: any) {
      const message = handleApiError(error, dispatch as AppDispatch)
      return rejectWithValue(message)
    }
  }
)

export const register = createAsyncThunk<{ message: string }, RegisterRequest>(
  'auth/register',
  async (data, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.post<ApiResponse<User>>('/auth/register', data)
      handleApiSuccess(dispatch as AppDispatch, 'Account Created!', response.data.message || 'Your account has been created successfully')
      return { message: response.data.message }
    } catch (error: any) {
      const message = handleApiError(error, dispatch as AppDispatch)
      return rejectWithValue(message)
    }
  }
)

export const logoutUser = createAsyncThunk<void, void>(
  'auth/logout',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const refreshToken = localStorage.getItem('refresh_token')
      if (refreshToken) {
        await api.post('/auth/logout', { refresh_token: refreshToken })
      }
    } catch (error: any) {
      // Continue with logout even if API call fails
    } finally {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
    }
  }
)

export const fetchUser = createAsyncThunk<User>('auth/fetchUser', async (_, { dispatch, rejectWithValue }) => {
  try {
    const response = await api.get<ApiResponse<User>>('/users/me')
    return response.data.data!
  } catch (error: any) {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    const message = handleApiError(error, dispatch as AppDispatch)
    return rejectWithValue(message)
  }
})

export const fetchProfile = createAsyncThunk<UserProfile>('auth/fetchProfile', async (_, { dispatch, rejectWithValue }) => {
  try {
    const response = await api.get<ApiResponse<UserProfile>>('/users/me')
    return response.data.data!
  } catch (error: any) {
    const message = handleApiError(error, dispatch as AppDispatch)
    return rejectWithValue(message)
  }
})

export const updateProfile = createAsyncThunk<User, Partial<User>>(
  'auth/updateProfile',
  async (profileData, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.put<ApiResponse<User>>('/users/me', profileData)
      handleApiSuccess(dispatch as AppDispatch, 'Profile Updated!', response.data.message || 'Your profile has been updated successfully')
      return response.data.data!
    } catch (error: any) {
      const message = handleApiError(error, dispatch as AppDispatch)
      return rejectWithValue(message)
    }
  }
)

export const fetchAddresses = createAsyncThunk<Address[]>('auth/fetchAddresses', async (_, { dispatch, rejectWithValue }) => {
  try {
    const response = await api.get<ApiResponse<Address[]>>('/users/me/addresses')
    return response.data.data || []
  } catch (error: any) {
    const message = handleApiError(error, dispatch as AppDispatch)
    return rejectWithValue(message)
  }
})

export const uploadAvatar = createAsyncThunk<string, File>(
  'auth/uploadAvatar',
  async (file, { dispatch, rejectWithValue }) => {
    try {
      const reader = new FileReader()
      const dataUrl = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(file)
      })
      
      const response = await api.put<ApiResponse<User>>('/users/me', { avatar_url: dataUrl })
      handleApiSuccess(dispatch as AppDispatch, 'Avatar Updated!', 'Your profile picture has been updated')
      return response.data.data!.avatar_url!
    } catch (error: any) {
      const message = handleApiError(error, dispatch as AppDispatch)
      return rejectWithValue(message)
    }
  }
)

export const createAddress = createAsyncThunk<Address, Omit<Address, 'uid' | 'id' | 'created_at' | 'is_active' | 'address_type'>>(
  'auth/createAddress',
  async (addressData, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.post<ApiResponse<Address>>('/users/me/addresses', {
        ...addressData,
        address_type: 'shipping'
      })
      handleApiSuccess(dispatch as AppDispatch, 'Address Added!', response.data.message || 'Address has been added successfully')
      return response.data.data!
    } catch (error: any) {
      const message = handleApiError(error, dispatch as AppDispatch)
      return rejectWithValue(message)
    }
  }
)

export const updateAddress = createAsyncThunk<Address, { uid: string; data: Partial<Address> }>(
  'auth/updateAddress',
  async ({ uid, data }, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.put<ApiResponse<Address>>(`/users/me/addresses/${uid}`, data)
      handleApiSuccess(dispatch as AppDispatch, 'Address Updated!', response.data.message || 'Address has been updated successfully')
      return response.data.data!
    } catch (error: any) {
      const message = handleApiError(error, dispatch as AppDispatch)
      return rejectWithValue(message)
    }
  }
)

export const deleteAddress = createAsyncThunk<string, string>(
  'auth/deleteAddress',
  async (uid, { dispatch, rejectWithValue }) => {
    try {
      await api.delete(`/users/me/addresses/${uid}`)
      handleApiSuccess(dispatch as AppDispatch, 'Address Deleted!', 'Address has been deleted successfully')
      return uid
    } catch (error: any) {
      const message = handleApiError(error, dispatch as AppDispatch)
      return rejectWithValue(message)
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuth: (state) => {
      state.user = null
      state.addresses = []
      state.token = null
      state.refreshToken = null
      state.isAuthenticated = false
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
    },
    clearError: (state) => {
      state.error = null
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false
        state.isAuthenticated = true
        state.user = action.payload.user
        state.token = action.payload.access_token
        state.refreshToken = action.payload.refresh_token
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      .addCase(register.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(register.fulfilled, (state) => {
        state.isLoading = false
        state.isAuthenticated = false
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null
        state.profile = null
        state.addresses = []
        state.token = null
        state.refreshToken = null
        state.isAuthenticated = false
      })
      .addCase(fetchUser.pending, (state) => {
        state.isLoading = true
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload
        state.isAuthenticated = true
      })
      .addCase(fetchUser.rejected, (state) => {
        state.isLoading = false
        state.isAuthenticated = false
        state.user = null
        state.token = null
        state.refreshToken = null
      })
      .addCase(fetchProfile.pending, (state) => {
        state.profileLoading = true
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.profileLoading = false
        state.profile = action.payload
      })
      .addCase(fetchProfile.rejected, (state) => {
        state.profileLoading = false
      })
      .addCase(updateProfile.pending, (state) => {
        state.profileLoading = true
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.profileLoading = false
        state.user = action.payload
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.profileLoading = false
        state.error = action.payload as string
      })
      .addCase(fetchAddresses.pending, (state) => {
        state.profileLoading = true
      })
      .addCase(fetchAddresses.fulfilled, (state, action) => {
        state.profileLoading = false
        state.addresses = action.payload
      })
      .addCase(fetchAddresses.rejected, (state) => {
        state.profileLoading = false
      })
      .addCase(createAddress.fulfilled, (state, action) => {
        state.addresses.push(action.payload)
      })
      .addCase(updateAddress.fulfilled, (state, action) => {
        const index = state.addresses.findIndex(a => a.uid === action.payload.uid)
        if (index !== -1) {
          state.addresses[index] = action.payload
        }
      })
      .addCase(deleteAddress.fulfilled, (state, action) => {
        state.addresses = state.addresses.filter(a => a.uid !== action.payload)
      })
  },
})

export const { clearAuth, clearError, updateUser } = authSlice.actions
export default authSlice.reducer
