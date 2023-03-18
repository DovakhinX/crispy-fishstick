import Head from 'next/head'
import { useState, useEffect } from 'react'

interface task {
  id: number,
  date: Date,
  task: string,
  status: boolean
}

interface Coordinates {
  lat: number | null;
  long: number | null;

}

export default function Home() {

  const [taskData, setTaskData] = useState<task[]>([]);
  const [selectedTask, setSelectedTask] = useState<number | null>(null);
  const [task, setTask] = useState<string>('');
  const [deadline, setDeadline] = useState(new Date());
  const [editStatus, setEditStatus] = useState(false);
  const [coordinates, setCoordinates] = useState<Coordinates>({ lat: null, long: null });
  const [city, setCity] = useState<string>('');
  const [locationEnabled, setLocationEnabled] = useState(false);


  function reverseGeo() {
    const options = {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': '7b04779c53msh1c6f47c0e66cae2p174f97jsnaf3ac31bbc08',
        'X-RapidAPI-Host': 'geocodeapi.p.rapidapi.com'
      }
    };

    if (coordinates.lat) {
      fetch(`https://geocodeapi.p.rapidapi.com/GetNearestCities?latitude=${coordinates.lat}&longitude=${coordinates.long}&range=0`, options)
        .then(response => response.json())
        .then(response => setCity(response[0].City))
        .catch(err => console.error(err));
    }
  }

  const sendNotification = async (data: string) => {
    const registration: ServiceWorkerRegistration | undefined = await navigator.serviceWorker.getRegistration();
    if (Notification.permission === 'granted') {
      if (registration && 'showNotification' in registration) {
        registration.showNotification(data)
      } else {
        new Notification('The List', {
          body: `${data}`,
          icon: '/icon-192x192.png'
        });
      }
    } else {
      if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();

        if (permission === 'granted') {

          if (registration && 'showNotification' in registration) {
            registration.showNotification(data)
          } else {
            new Notification('The List', {
              body: `${data}`,
              icon: '/icon-192x192.png'
            });

          }
        }
      }
    }
  };



  function getLocation() {
    if (!navigator.geolocation) {
      console.log('Geolocation is not supported');
      setLocationEnabled(false);
      return;
    }
    navigator.permissions.query({ name: 'geolocation' }).then((result: PermissionStatus) => {
      if (result.state === 'granted' || result.state === 'prompt') {
        navigator.geolocation.getCurrentPosition((position) => {
          setCoordinates({ lat: position.coords.latitude, long: position.coords.longitude });
          setLocationEnabled(true);
        });
      } else if (result.state === 'denied') {
        console.log('Location permission denied');
        setLocationEnabled(false);
        return;
      }
    })
  }





  useEffect(() => {
    getLocation()
  }, []);
  //
  useEffect(() => {
    reverseGeo()
    // eslint-disable-next-line
  }, [coordinates.lat]);





  function handleDate(event: React.ChangeEvent<HTMLInputElement>) {
    const dateString = event.target.value;
    const dateObj = new Date(dateString);
    setDeadline(dateObj);
  }

  function addTask(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    event.preventDefault();
    if (task.trim() === '') return;
    const newId = taskData.length === 0 ? 1 : taskData[taskData.length - 1].id + 1;
    const newTask = { id: newId, date: deadline, task: task, status: false };
    setTaskData([...taskData, newTask]);
    setTask('');
    setDeadline(new Date());
    sendNotification('New task added');
  }


  function removeTask(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    event.preventDefault();
    if (!selectedTask) return;
    setTaskData(taskData.filter((item) => item.id !== selectedTask));
    setSelectedTask(null);
    sendNotification(' Task removed');
  }


  function editTask(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    event.preventDefault();
    if (!selectedTask) return;
    const editedTask = taskData.find((item) => item.id === selectedTask);
    if (editedTask) {
      setEditStatus(true)
      setTask(editedTask.task);
      setDeadline(editedTask.date);
    }
  }


  function updateTask(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    event.preventDefault();
    if (task === "") return;
    const updatedData = taskData.map((item) => {
      if (item.id === selectedTask) {
        return { ...item, task: task, date: deadline }
      } else {
        return item;
      }
    });
    setTaskData(updatedData);
    setTask('');
    setDeadline(new Date());
    setSelectedTask(null);
    setEditStatus(false);
    sendNotification(' Task edited');

  }




  return (
    <>
      <Head>
        <title>The List</title>
      </Head>
      <main className='container bg-slate-600 w-96  h-screen px-4 py-6'>
        <div className='flex flex-col '>
          <div className='flex flex-col gap-5'>
            <div className='flex flex-col gap-5  items-center '>
              <input className='rounded w-full' value={task} onChange={(e) => setTask(e.target.value)} />
              <input className='rounded w-40' type='date' value={deadline.toISOString().slice(0, 10)} onChange={handleDate} />
            </div>
            {editStatus ? (<div className='flex flex-row gap-3 justify-center'>
              <button className='bg-slate-400 rounded px-2 py-1' onClick={(event) => updateTask(event)}>Confirm Edit</button>
              <button className='bg-slate-400 rounded px-2 py-1' onClick={() => setEditStatus(false)}>Cancel Edit</button>
            </div>) : (<div className='flex flex-row gap-3 justify-center'>
              <button className='bg-slate-400 rounded px-2 py-1' onClick={(event) => addTask(event)}>Add Task</button>
              <button className='bg-slate-400 rounded px-2 py-1' onClick={(event) => removeTask(event)}>Remove Task</button>
              <button className='bg-slate-400 rounded px-2 py-1 z-10' onClick={(event) => editTask(event)}>Edit Task</button>
            </div>)}

            <div className='rounded-sm flex-col flex  '>
              <ul>
                {taskData.map((item) => (
                  <li key={item.id} onClick={() => selectedTask === item.id ? setSelectedTask(null) : setSelectedTask(item.id)} className={`${selectedTask === item.id ? 'bg-slate-100' : 'bg-slate-300'}`}>
                    <div className='flex  justify-between items-center px-1'>
                      <p>{item.task}</p>
                      <p>{item.date.toISOString().slice(0, 10)}</p>
                    </div>
                    <hr />
                  </li>
                ))}
              </ul>
              {locationEnabled? <p className='self-center py-4'>Your Location:{city}</p> : <p className='self-center py-4'>(Please enable your location services)</p>}
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
