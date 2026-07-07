import { useState } from 'react';
import { Calendar, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const DateAvailabilityChecker = ({ vehicle, onAvailabilityToggle }) => {
    const [selectedDate, setSelectedDate] = useState('');
    const [checking, setChecking] = useState(false);
    const [bookingStatus, setBookingStatus] = useState(null); // null | 'available' | 'booked'
    const [bookingDetails, setBookingDetails] = useState(null);
    const [toggling, setToggling] = useState(false);

    const handleDateChange = async (date) => {
        setSelectedDate(date);
        setBookingStatus(null);
        setBookingDetails(null);

        if (!date) return;

        // Check if date is in the past
        const selectedDateTime = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedDateTime < today) {
            toast.error('Cannot check availability for past dates');
            return;
        }

        setChecking(true);

        try {
            const response = await api.post('/sponsor/check-date-availability', {
                vehicleId: vehicle.id || vehicle._id,
                vehicleType: vehicle.type || 'bike',
                date: date
            });

            if (response.data.hasBooking) {
                setBookingStatus('booked');
                setBookingDetails(response.data.bookingDetails);
            } else {
                setBookingStatus('available');
            }
        } catch (error) {
            console.error('Error checking availability:', error);
            toast.error('Failed to check availability');
        } finally {
            setChecking(false);
        }
    };

    const handleToggleAvailability = async () => {
        if (bookingStatus === 'booked') {
            toast.error('Cannot toggle availability - vehicle has bookings on this date');
            return;
        }

        setToggling(true);
        try {
            const newStatus = !(vehicle.is_available || vehicle.isAvailable);

            await api.patch(`/sponsor/bikes/${vehicle.id || vehicle._id}/availability`, {
                isAvailable: newStatus,
                type: vehicle.type || 'bike'
            });

            toast.success(`Vehicle marked as ${newStatus ? 'available' : 'unavailable'}`);

            // Call parent callback to refresh data
            if (onAvailabilityToggle) {
                onAvailabilityToggle();
            }
        } catch (error) {
            console.error('Error toggling availability:', error);
            toast.error('Failed to update availability');
        } finally {
            setToggling(false);
        }
    };

    const getTodayDate = () => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    };

    return (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-600 rounded-lg">
                    <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h3 className="font-bold text-gray-800">Check Date Availability</h3>
                    <p className="text-xs text-gray-500">Select a date to check bookings</p>
                </div>
            </div>

            <div className="space-y-4">
                {/* Date Picker */}
                <div className="relative">
                    <input
                        type="date"
                        value={selectedDate}
                        min={getTodayDate()}
                        onChange={(e) => handleDateChange(e.target.value)}
                        className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium text-gray-700"
                    />
                </div>

                {/* Loading State */}
                {checking && (
                    <div className="flex items-center justify-center gap-2 py-4 bg-white rounded-xl border border-gray-200">
                        <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                        <span className="text-sm text-gray-600 font-medium">Checking availability...</span>
                    </div>
                )}

                {/* Booking Status Display */}
                {!checking && bookingStatus === 'available' && (
                    <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 animate-fade-in">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-green-100 rounded-lg shrink-0">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-green-800 mb-1">No Bookings Found</h4>
                                <p className="text-sm text-green-700 mb-3">
                                    This vehicle has no bookings on {new Date(selectedDate).toLocaleDateString('en-US', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </p>

                                {/* Toggle Availability Button */}
                                <button
                                    onClick={handleToggleAvailability}
                                    disabled={toggling}
                                    className={`
                                        w-full px-4 py-2.5 rounded-lg font-semibold text-sm transition-all
                                        ${toggling
                                            ? 'bg-gray-300 cursor-not-allowed'
                                            : (vehicle.is_available || vehicle.isAvailable)
                                                ? 'bg-red-500 hover:bg-red-600 text-white shadow-md hover:shadow-lg'
                                                : 'bg-green-500 hover:bg-green-600 text-white shadow-md hover:shadow-lg'
                                        }
                                    `}
                                >
                                    {toggling ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Updating...
                                        </span>
                                    ) : (
                                        <span>
                                            {(vehicle.is_available || vehicle.isAvailable)
                                                ? '✓ Mark as Unavailable'
                                                : '✓ Mark as Available'}
                                        </span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {!checking && bookingStatus === 'booked' && bookingDetails && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 animate-fade-in">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-red-100 rounded-lg shrink-0">
                                <XCircle className="w-5 h-5 text-red-600" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-red-800 mb-1">Booking Exists</h4>
                                <p className="text-sm text-red-700 mb-3">
                                    This vehicle has a booking on this date. Cannot toggle availability.
                                </p>

                                {/* Booking Details */}
                                <div className="bg-white rounded-lg p-3 space-y-2 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 font-medium">Booking ID:</span>
                                        <span className="text-gray-800 font-semibold">#{bookingDetails.booking_id || bookingDetails.id}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 font-medium">Status:</span>
                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-semibold capitalize">
                                            {bookingDetails.status}
                                        </span>
                                    </div>
                                    {bookingDetails.start_date && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-500 font-medium">Start:</span>
                                            <span className="text-gray-800 font-semibold">
                                                {new Date(bookingDetails.start_date).toLocaleDateString()}
                                            </span>
                                        </div>
                                    )}
                                    {bookingDetails.end_date && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-500 font-medium">End:</span>
                                            <span className="text-gray-800 font-semibold">
                                                {new Date(bookingDetails.end_date).toLocaleDateString()}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Warning Message */}
                                <div className="mt-3 flex items-start gap-2 bg-red-100 rounded-lg p-2">
                                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                                    <p className="text-xs text-red-700 font-medium">
                                        You cannot mark this vehicle as unavailable while it has active bookings.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Initial State / No Status - Show when not checking and no result yet */}
                {!checking && !bookingStatus && (
                    <div className={`border-2 border-dashed rounded-xl p-6 text-center ${selectedDate ? 'bg-red-50 border-red-200' : 'bg-white border-gray-300'}`}>
                        {selectedDate ? (
                            <>
                                <AlertCircle className="w-12 h-12 text-red-300 mx-auto mb-3" />
                                <p className="text-sm text-red-600 font-medium">
                                    Please select a valid future date to check availability.
                                </p>
                            </>
                        ) : (
                            <>
                                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-sm text-gray-500 font-medium">
                                    Select a date above to check if this vehicle has any bookings
                                </p>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DateAvailabilityChecker;
