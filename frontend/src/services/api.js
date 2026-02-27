import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 10000
})

export const fetchMessages = (channelId, limit = 20) =>
  api.get(`/messages/${channelId}`, { params: { limit } })

export const deleteMessage = (messageId) =>
  api.delete(`/messages/message/${messageId}`)

export const deleteChannel = (channelId) =>
  api.delete(`/channels/${channelId}`)

export default api
