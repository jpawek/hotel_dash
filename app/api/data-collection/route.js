export const revalidate = 0
export const dynamic = 'force-dynamic'

// Fetch data from StayNTouch API and filter it into a reduced, usable format for dynamic page rendering //
export async function GET(request) {
    const roomMap = new Map()
    const key = "821be90ed794d169e6cc9d36d79525a6d61c8d256fe7f4a2a4e52934ab86e26e"
  
    // Object prototype used for date ranges //
    Date.prototype.addDays = function(days) {
      var date = new Date(this.valueOf());
      date.setDate(date.getDate() + days);
      return date;
    }
    
    // Current date formatted to be used in requests //
    const curDate = new Date().toISOString().replace(/T.*/,'')

    const serviceRangeMax = new Date().addDays(49).toISOString().replace(/T.*/,'')
  
    // Using room id and roomMap key, find service date range via /service_status endpoint //
    async function getOosDates(id, key) {
      const url = "https://api-uat.stayntouch.com/connect/rooms/"+id+"/service_status?from_date="+curDate+"&to_date="+serviceRangeMax+"&per_page=50"
      const body = {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer '+key,
          'API-Version': '2.0',
          'X-Requested-With': 'XMLHttpRequest'
        }
      }
      const serviceDates = await fetch(url, body, { cache: 'no-store' })
      const serviceDatesJson = await serviceDates.json()

      var dayCount = -1
      serviceDatesJson.results?.every((date) => {
        if (date.service_status == "IN_SERVICE") {
          return false
        }
        dayCount += 1
        return true
      })
      const serviceRangeActual = new Date().addDays(dayCount).toISOString().replace(/T.*/,'')

      roomMap.get(key).service_dates = [curDate, serviceRangeActual]
    }
    
    // Find rooms due out via the filtration of the /reservations endpoint //
    async function getDueOuts() {
      const url = "https://api-uat.stayntouch.com/connect/reservations?hotel_id=299&checked_in=true&date_filter=departure&date="+curDate+"&per_page=50"
      const body = {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer '+key,
          'API-Version': '2.0',
          'X-Requested-With': 'XMLHttpRequest'
        }
      }
      const dueOuts = await fetch(url, body, { cache: 'no-store' })
      const dueOutsJson = await dueOuts.json()
      dueOutsJson.results.forEach((dueOut) => {
        roomMap.forEach((room) => {
            if (room.internal_id == dueOut.room.id) {
                room.due_out = true
                room.checkout_time = dueOut.departure_time
            }
        })
      })
      if (dueOutsJson.total_count > 50) {
        var pageCounter = 1
        while (dueOutsJson.total_count > (50 * pageCounter)) {
          pageCounter += 1
          const dueOuts = await fetch(url+"&page="+pageCounter, body, { cache: 'no-store' })
          const dueOutsJson = await dueOuts.json()
          dueOutsJson.results.forEach((dueOut) => {
            roomMap.forEach((room) => {
                if (room.internal_id == dueOut.room.id) {
                    room.due_out = true
                    room.checkout_time = dueOut.departure_time
                }
            })
          })
        }
      }
      return roomMap
    }
  
    // Collect desired room data from the /rooms endpoint //
    async function getRoomData() {
      const url = "https://api-uat.stayntouch.com/connect/rooms?hotel_id=299&per_page=50"
      const body = {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer '+key,
          'API-Version': '2.0',
          'X-Requested-With': 'XMLHttpRequest'
        }
      }
      const rooms = await fetch(url, body, { cache: 'no-store' })
      const roomsJson = await rooms.json()
      var room_count = 0
      roomsJson.results.forEach((room) => {
        roomMap.set(room_count, {internal_id: room.id,
                              number: room.number, 
                              status: room.status, 
                              service_status: room.service_status,
                              service_dates: [], 
                              occupied: room.occupied,
                              due_out: false,
                              checkout_time: ""})
        if (room.service_status != "IN_SERVICE") {
          getOosDates(room.id, room_count)
        }
        room_count += 1
      })
      if (roomsJson.total_count > 50) {
        var pageCounter = 1
        while (roomsJson.total_count > (50 * pageCounter)) {
          pageCounter += 1
          const rooms = await fetch(url+"&page="+pageCounter, body, { cache: 'no-store' })
          const roomsJson = await rooms.json()
          roomsJson.results.forEach((room) => {
            roomMap.set(room_count, {internal_id: room.id,
                                  number: room.number, 
                                  status: room.status, 
                                  service_status: room.service_status,
                                  service_dates: [], 
                                  occupied: room.occupied,
                                  due_out: false,
                                  checkout_time: ""})
            if (room.service_status != "IN_SERVICE") {
              getOosDates(room.id, room_count)
            }
            room_count += 1
          })
        }
      }
      await getDueOuts()
      return roomMap
    }

    const data = Array.from(await getRoomData())

    return Response.json(data);
  }