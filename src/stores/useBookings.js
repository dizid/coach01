import { defineStore } from 'pinia'

/**
 * Store for managing bookings and commission tracking
 * Tracks user selections, contact requests, and affiliate commissions
 */
export const useBookingsStore = defineStore({
    id: 'bookings',

    state: () => ({
        currentBooking: null,      // Current booking in progress
        bookingHistory: [],        // All bookings/contacts made by user
        commissions: [],           // Commission tracking records
        totalCommissionEarned: 0,  // Total commission amount (for platform)
    }),

    getters: {
        /**
         * Get pending bookings (awaiting confirmation)
         * @returns {Array} Pending bookings
         */
        pendingBookings: (state) => {
            return state.bookingHistory.filter(booking => booking.status === 'pending')
        },

        /**
         * Get confirmed bookings
         * @returns {Array} Confirmed bookings
         */
        confirmedBookings: (state) => {
            return state.bookingHistory.filter(booking => booking.status === 'confirmed')
        },

        /**
         * Get total potential commission from all bookings
         * @returns {number} Total commission amount
         */
        totalPotentialCommission: (state) => {
            return state.bookingHistory.reduce((total, booking) => {
                return total + (booking.commissionAmount || 0)
            }, 0)
        },

        /**
         * Check if user has already contacted a specific coach
         * @returns {Function} Function that takes coachId and returns boolean
         */
        hasContactedCoach: (state) => {
            return (coachId) => {
                return state.bookingHistory.some(booking => booking.coachId === coachId)
            }
        }
    },

    actions: {
        /**
         * Create a new booking/contact request
         * @param {Object} bookingData - Booking details
         * @returns {Object} Created booking object
         */
        createBooking(bookingData) {
            const booking = {
                id: this.generateBookingId(),
                coachId: bookingData.coachId,
                coachName: bookingData.coachName,
                userEmail: bookingData.userEmail,
                userName: bookingData.userName,
                userPhone: bookingData.userPhone || '',
                userMessage: bookingData.userMessage || '',
                preferredDate: bookingData.preferredDate || null,
                preferredTime: bookingData.preferredTime || null,
                sessionType: bookingData.sessionType || 'intake', // intake, regular, package
                status: 'pending', // pending, contacted, confirmed, cancelled
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                // Commission tracking
                coachPrice: bookingData.coachPrice,
                commissionRate: bookingData.commissionRate,
                commissionAmount: this.calculateCommission(
                    bookingData.coachPrice,
                    bookingData.commissionRate
                ),
                // Tracking for conversion
                referralSource: 'platform',
                affiliateId: this.generateAffiliateId(),
            }

            this.currentBooking = booking
            this.bookingHistory.push(booking)

            // Track commission
            this.trackCommission(booking)

            return booking
        },

        /**
         * Calculate commission amount
         * @param {number} price - Coach session price
         * @param {number} rate - Commission rate (percentage)
         * @returns {number} Commission amount in euros
         */
        calculateCommission(price, rate) {
            return Math.round(price * (rate / 100) * 100) / 100
        },

        /**
         * Track commission for analytics and payment
         * @param {Object} booking - Booking object
         */
        trackCommission(booking) {
            const commission = {
                id: this.generateCommissionId(),
                bookingId: booking.id,
                coachId: booking.coachId,
                amount: booking.commissionAmount,
                rate: booking.commissionRate,
                status: 'pending', // pending, earned, paid
                createdAt: new Date().toISOString(),
                earnedAt: null,
                paidAt: null,
            }

            this.commissions.push(commission)
        },

        /**
         * Update booking status
         * @param {string} bookingId - Booking ID
         * @param {string} status - New status
         */
        updateBookingStatus(bookingId, status) {
            const booking = this.bookingHistory.find(b => b.id === bookingId)
            if (booking) {
                booking.status = status
                booking.updatedAt = new Date().toISOString()

                // If confirmed, mark commission as earned
                if (status === 'confirmed') {
                    this.markCommissionEarned(bookingId)
                }
            }
        },

        /**
         * Mark commission as earned (when booking is confirmed)
         * @param {string} bookingId - Booking ID
         */
        markCommissionEarned(bookingId) {
            const commission = this.commissions.find(c => c.bookingId === bookingId)
            if (commission) {
                commission.status = 'earned'
                commission.earnedAt = new Date().toISOString()
                this.totalCommissionEarned += commission.amount
            }
        },

        /**
         * Generate unique booking ID
         * @returns {string} Booking ID
         */
        generateBookingId() {
            return `BK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        },

        /**
         * Generate unique commission ID
         * @returns {string} Commission ID
         */
        generateCommissionId() {
            return `CM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        },

        /**
         * Generate affiliate tracking ID
         * @returns {string} Affiliate ID
         */
        generateAffiliateId() {
            return `AFF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        },

        /**
         * Clear current booking
         */
        clearCurrentBooking() {
            this.currentBooking = null
        },

        /**
         * Get booking by ID
         * @param {string} bookingId - Booking ID
         * @returns {Object|null} Booking object or null
         */
        getBookingById(bookingId) {
            return this.bookingHistory.find(b => b.id === bookingId) || null
        },

        /**
         * Send booking confirmation email (placeholder - integrate with backend)
         * @param {Object} booking - Booking object
         */
        async sendBookingConfirmation(booking) {
            // TODO: Integrate with email service (SendGrid, Mailgun, etc.)
            console.log('Sending booking confirmation email:', {
                to: booking.userEmail,
                coach: booking.coachName,
                bookingId: booking.id
            })

            // In production, this would make an API call to your backend
            // which would handle the email sending and coach notification
            return true
        },

        /**
         * Get commission statistics
         * @returns {Object} Commission stats
         */
        getCommissionStats() {
            const pending = this.commissions.filter(c => c.status === 'pending')
            const earned = this.commissions.filter(c => c.status === 'earned')
            const paid = this.commissions.filter(c => c.status === 'paid')

            return {
                totalCommissions: this.commissions.length,
                pendingCount: pending.length,
                earnedCount: earned.length,
                paidCount: paid.length,
                pendingAmount: pending.reduce((sum, c) => sum + c.amount, 0),
                earnedAmount: earned.reduce((sum, c) => sum + c.amount, 0),
                paidAmount: paid.reduce((sum, c) => sum + c.amount, 0),
                totalAmount: this.commissions.reduce((sum, c) => sum + c.amount, 0)
            }
        }
    }
})
