'use client';

import { useState, useEffect } from 'react';
import { redirect } from 'next/navigation';

export default function HomePage() {

    const Auth = false;
    if (!Auth) {
        redirect("/login")
    }

    const [roomData, setData] = useState([]);

    async function fetchData() {
        fetch("./api/data-collection", { cache: 'no-store' })
        .then((response) => response.json())
        .then((data) => setData(data))
    }

    // Collect filtered hotel data from data-collection API on page laod //
    useEffect(() => {
        fetchData()
    }, []);

    return (
        <>
        <div className='dash_container'>
            {roomData.map(room => {
                if (room[1].occupied) {
                    // Display time due out if room is checking out today //
                    if (room[1].due_out) {
                        return (
                            <div className='occ_room' key={room[0]}>
                                <p className='room_num'>{room[1].number}</p>
                                <p className='room_info'>OCCUPIED</p>
                                <p className='room_info'>DUE OUT</p>
                                <p className='room_info'>{room[1].checkout_time}</p>
                            </div>
                        );
                    } else {
                        return (
                            <div className='occ_room' key={room[0]}>
                                <p className='room_num'>{room[1].number}</p>
                                <p className='room_info'>OCCUPIED</p>
                            </div>
                        );
                    }
                } else if (room[1].service_status != 'IN_SERVICE') {
                    // Specify service type in room card //
                    if (room[1].service_status == 'OUT_OF_SERVICE') {
                        return (
                            <div className='service_room' key={room[0]}>
                                <p className='room_num'>{room[1].number}</p>
                                <p className='room_info'>OUT OF SERVICE</p>
                                <pre>{room[1].service_dates[0]}</pre>
                                <pre>to</pre>
                                <pre>{room[1].service_dates[1]}</pre>
                            </div>
                        );
                    } else {
                        return (
                            <div className='service_room' key={room[0]}>
                                <p className='room_num'>{room[1].number}</p>
                                <p className='room_info'>OUT OF ORDER</p>
                                <pre>{room[1].service_dates[0]}</pre>
                                <pre>to</pre>
                                <pre>{room[1].service_dates[1]}</pre>
                            </div>
                        );
                    }
                } else {
                    // Display housekeeping status if room is not occupied or being serviced //
                    if (room[1].status == 'DIRTY') {
                        return (
                            <div className='dirty_room' key={room[0]}>
                                <p className='room_num'>{room[1].number}</p>
                                <p className='room_info'>{room[1].status}</p>
                            </div>
                        );
                    } else if (room[1].status == 'PICKUP') {
                        return (
                            <div className='pickup_room' key={room[0]}>
                                <p className='room_num'>{room[1].number}</p>
                                <p className='room_info'>{room[1].status}</p>
                            </div>
                        );
                    } else if (room[1].status == 'CLEAN') {
                        return (
                            <div className='clean_room' key={room[0]}>
                                <p className='room_num'>{room[1].number}</p>
                                <p className='room_info'>{room[1].status}</p>
                            </div>
                        );
                    } else {
                        return (
                            <div className='inspected_room' key={room[0]}>
                                <p className='room_num'>{room[1].number}</p>
                                <p className='room_info'>{room[1].status}</p>
                            </div>
                        );
                    }
                }
            })}
        </div>
        </>
    )
}
