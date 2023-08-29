import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

type TimeSlot = {
  time: string;
  isBooked: boolean;
};

type BookedSlots = {
  [date: string]: TimeSlot[];
};

const generateTimeSlots = (): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  for (let i = 8; i <= 20; i++) {
    ['00', '30'].forEach((minutes) => {
      const time = `${i < 10 ? '0' + i : i}:${minutes}`;
      slots.push({ time, isBooked: false });
    });
  }
  return slots;
};

const AppointmentScheduler: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [bookedSlots, setBookedSlots] = useState<BookedSlots>({});
  const [allBookings, setAllBookings] = useState<{ [date: string]: TimeSlot[] }>({});
  const authToken = localStorage.getItem("authToken");
  const navigate = useNavigate();

  const helper = () => {
    axios
      .post("http://localhost:5012/api/bookings", { authToken })
      .then((response) => {
        const fetchedBookedSlots: BookedSlots = {};
        Object.keys(response.data).forEach((date) => {
          // Initialize with all slots as unbooked
          fetchedBookedSlots[date] = generateTimeSlots();

          // Update the specific slots that are booked
          const bookedSlots = response.data[date];
          fetchedBookedSlots[date] = fetchedBookedSlots[date].map((slot) => {
            const matchingBookedSlot = bookedSlots.find(
              (bookedSlot: any) => bookedSlot.time === slot.time
            );
            if (matchingBookedSlot) {
              return { ...slot, isBooked: matchingBookedSlot.isBooked };
            }
            return slot;
          });
        });
        setAllBookings(fetchedBookedSlots);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
  };


const assist = () => {
  axios
    .get("http://localhost:5012/api/allbookings")
    .then((response) => {
      const fetchedBookedSlots: BookedSlots = {};
      Object.keys(response.data).forEach((date) => {
        // Initialize with all slots as unbooked
        fetchedBookedSlots[date] = generateTimeSlots();

        // Update the specific slots that are booked
        const bookedSlots = response.data[date];
        fetchedBookedSlots[date] = fetchedBookedSlots[date].map((slot) => {
          const matchingBookedSlot = bookedSlots.find(
            (bookedSlot:any) => bookedSlot.time === slot.time
          );
          if (matchingBookedSlot) {
            return { ...slot, isBooked: matchingBookedSlot.isBooked };
          }
          return slot;
        });
      });
      setBookedSlots(fetchedBookedSlots);
    })
    .catch((error) => {
      console.error("Error fetching data:", error);
    });
};


  useEffect(() => {
    if (!localStorage.getItem("authToken"))
    {
      navigate('/');
    }
    helper();
    assist();
  }, [selectedDate]);

    const handleLogout = () => {
      localStorage.removeItem("authToken"); // Clear the auth token
      navigate("/"); // Navigate to the '/' route
    };
  
  const isPastTimeSlot = (date: string, time: string) => {
  const currentTime = new Date();
  const slotTime = new Date(`${date} ${time}`);
  return currentTime > slotTime;
};



const bookSlot = (slot: TimeSlot, date: string) => {
  const updatedSlot: TimeSlot = { ...slot, isBooked: true };
  axios
    .post("http://localhost:5012/api/book", { date, updatedSlot, authToken })
    .then((response) => {
      const existingSlots = bookedSlots[date] || generateTimeSlots();
      const updatedSlots = existingSlots.map((s) => {
        if (s.time === updatedSlot.time) {
          return updatedSlot;
        }
        return s;
      });
      setBookedSlots({ ...bookedSlots, [date]: updatedSlots });

      const existingAllBookings = allBookings[date] || [];
      const updatedAllBookings = [...existingAllBookings, updatedSlot];
      setAllBookings({ ...allBookings, [date]: updatedAllBookings });
    })
    .catch((error) => {
      console.error("Error booking slot:", error);
    });
  helper();
};

  
  useEffect(() => {
    const interval = setInterval(() => {
      helper();
      assist();
    }, 100);
    return () => clearInterval(interval);
  }, []);


const cancelBooking = (slot: TimeSlot, date: string) => {
  axios.delete(`http://localhost:5012/api/cancel/${date}/${slot.time}`)
    .then(response => {
      // Update the isBooked flag to false for the cancelled slot
      const updatedSlots = bookedSlots[date]?.map(s => {
        if (s.time === slot.time) {
          return { ...s, isBooked: false };
        }
        return s;
      }) || [];
      setBookedSlots({ ...bookedSlots, [date]: updatedSlots });

      // Update the isBooked flag to false in allBookings as well
      const updatedAllBookings = allBookings[date]?.map(s => {
        if (s.time === slot.time) {
          return { ...s, isBooked: false };
        }
        return s;
      }) || [];
      setAllBookings({ ...allBookings, [date]: updatedAllBookings });
    })
    .catch(error => {
      console.error('Error canceling booking:', error);
      // Optionally, show an error message to the user
    });
};


  const dateKey = selectedDate?.toDateString() ?? '';
  const timeSlots = generateTimeSlots();

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="flex flex-col items-center mt-2 p-2 pb-8 max-w-md mx-auto bg-gray-200 text-black">
        <button
          onClick={handleLogout}
          className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded"
        >
          Logout
        </button>
        <h1 className="text-xl font-bold mb-2">Appointment Scheduler</h1>
        <div className="mb-4">
          <Calendar
            onChange={(value, event) => {
              if (value instanceof Date) {
                setSelectedDate(value);
              }
            }}
            value={selectedDate}
            minDate={new Date()}
          />
        </div>
        {selectedDate && (
          <div className="relative w-full">
            <h2 className="text-lg font-semibold mb-2 sticky top-0 z-10 bg-gray-200">
              Available Time Slots on {selectedDate.toDateString()}
            </h2>
            <div className="flex w-full overflow-x-auto">
              {bookedSlots[dateKey] &&
                bookedSlots[dateKey].map((slot: TimeSlot, index: number) => (
                  <div
                    key={index}
                    className={`p-2 border rounded mr-2 ${
                      slot.isBooked || isPastTimeSlot(dateKey, slot.time)
                        ? "bg-gray-300 text-gray-600"
                        : "bg-green-300 text-green-800"
                    }`}
                  >
                    {slot.time}
                    {slot.isBooked ? (
                      <button
                        disabled
                        className="bg-red-500 text-white px-1 py-0.5 rounded"
                      >
                        {isPastTimeSlot(dateKey, slot.time) ? (
                          <span>Expired</span>
                        ) : (
                          <span>Booked</span>
                        )}
                      </button>
                    ) : isPastTimeSlot(dateKey, slot.time) ? (
                      <button
                        disabled
                        className="bg-yellow-500 text-white px-1 py-0.5 rounded"
                      >
                        <s>Book</s>
                      </button>
                    ) : (
                      <button
                        className="bg-blue-500 text-white px-1 py-0.5 rounded"
                        onClick={() => bookSlot(slot, dateKey)}
                      >
                        Book
                      </button>
                    )}
                  </div>
                ))}
              {bookedSlots[dateKey] === undefined &&
                timeSlots.map((slot: TimeSlot, index: number) => (
                  <div
                    key={index}
                    className={`p-2 border rounded mr-2 ${
                      slot.isBooked
                        ? "bg-gray-300 text-gray-600"
                        : "bg-green-300 text-green-800"
                    }`}
                  >
                    {slot.time}
                    {slot.isBooked ? (
                      <button
                        disabled
                        className="bg-red-500 text-white px-1 py-0.5 rounded"
                      >
                        Booked
                      </button>
                    ) : (
                      <button
                        disabled={isPastTimeSlot(dateKey, slot.time)}
                        className="bg-blue-500 text-white px-1 py-0.5 rounded"
                        onClick={() => bookSlot(slot, dateKey)}
                      >
                        Book
                      </button>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}
        {Object.keys(allBookings).length > 0 && (
          <div
            className="mt-4 p-2 border rounded bg-white text-black overflow-y-auto"
            style={{ maxHeight: "200px" }}
          >
            <h2 className="text-lg font-semibold mb-2">
              Your upcoming Bookings
            </h2>
            <div className="flex flex-wrap">
              {Object.keys(allBookings).map((date) =>
                allBookings[date]
                  .filter((slot) => slot.isBooked)
                  .map(
                    (slot, index) =>
                      !isPastTimeSlot(date, slot.time) && (
                        <div
                          key={`${date}-${index}`}
                          className="p-2 border rounded mr-2 mb-2"
                        >
                          <h3>{date}</h3>
                          <p>Time: {slot.time}</p>
                          <button
                            className="bg-red-500 text-white px-2 py-1 rounded mt-1 block"
                            onClick={() => cancelBooking(slot, date)}
                          >
                            Cancel
                          </button>
                        </div>
                      )
                  )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentScheduler;
