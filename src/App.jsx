import { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import TaskInput from "./components/ToDoApp";
import './index.css'
import './App.css'


function App() {
  const [tasks, setTasks] = useState([]);

  const addTask = (text) => {
    if (!text.trim()) return;
    setTasks([...tasks, { id: Date.now().toString(), text }]);
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter((task) => task.id !== id));
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const newTasks = Array.from(tasks);
    const [movedTask] = newTasks.splice(result.source.index, 1);
    newTasks.splice(result.destination.index, 0, movedTask);

    setTasks(newTasks);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-4 text-center">To-Do List</h1>
        <TaskInput addTask={addTask} />

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="tasks">
            {(provided) => (
              <ul
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="mt-4 space-y-2"
              >
                {tasks.map((task, index) => (
                  <Draggable key={task.id} draggableId={task.id} index={index}>
                    {(provided, snapshot) => (
                      <li
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`p-4 bg-gray-50 rounded flex justify-between items-center shadow ${
                          snapshot.isDragging ? "bg-blue-100" : ""
                        }`}
                      >
                        <span>{task.text}</span>
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="text-red-500 font-bold hover:text-red-700"
                        >
                          X
                        </button>
                      </li>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </ul>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  );
}

export default App;
