"use client";

import { useState, useEffect } from "react";

export default function TodoApp() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [category, setCategory] = useState("personal");
  const [priority, setPriority] = useState("low");
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [darkMode, setDarkMode] = useState(true);
  const [draggedIndex, setDraggedIndex] = useState(null);

  // Load saved tasks & theme
  useEffect(() => {
    const saved = localStorage.getItem("tasks");
    if (saved) setTasks(JSON.parse(saved));

    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) setDarkMode(savedTheme === "dark");
  }, []);

  // Save tasks to localStorage
  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  // Save theme to localStorage
  useEffect(() => {
    localStorage.setItem("theme", darkMode ? "dark" : "light");
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  // --- CRUD FUNCTIONS ---
  const addTask = () => {
    if (!newTask.trim()) return;

    const task = {
      id: Date.now(),
      text: newTask,
      completed: false,
      category,
      priority,
      editing: false,
    };

    setTasks([...tasks, task]);
    setNewTask("");
  };

  const deleteTask = (id) => setTasks(tasks.filter((t) => t.id !== id));
  const toggleComplete = (id) =>
    setTasks(tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  const toggleEdit = (id) =>
    setTasks(tasks.map((t) => (t.id === id ? { ...t, editing: !t.editing } : t)));
  const updateTaskText = (id, text) =>
    setTasks(tasks.map((t) => (t.id === id ? { ...t, text, editing: false } : t)));

  const markAllCompleted = () =>
    setTasks(tasks.map((t) => ({ ...t, completed: true })));
  const clearCompleted = () =>
    setTasks(tasks.filter((t) => !t.completed));
  const deleteAll = () => {
    if (window.confirm("Are you sure you want to delete all tasks?")) setTasks([]);
  };

  // --- IMPORT / EXPORT ---
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "tasks.json";
    link.click();
  };

  const importJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        setTasks(JSON.parse(event.target.result));
      } catch {
        alert("Invalid JSON file");
      }
    };
    reader.readAsText(file);
  };

  // --- DRAG & DROP ---
  const handleDragStart = (index) => setDraggedIndex(index);
  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const updated = [...tasks];
    const [moved] = updated.splice(draggedIndex, 1);
    updated.splice(index, 0, moved);

    setDraggedIndex(index);
    setTasks(updated);
  };
  const handleDragEnd = () => setDraggedIndex(null);

  // --- FILTER & SEARCH ---
  const filteredTasks = tasks.filter((t) => {
    const matchSearch = t.text.toLowerCase().includes(searchQuery.toLowerCase());
    const matchFilter = activeFilter === "all" || t.category === activeFilter;
    return matchSearch && matchFilter;
  });

  // --- STATS ---
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const remaining = total - completed;

  // --- UI HELPERS ---
  const getPriorityColor = (p) => {
    switch (p) {
      case "high":
        return "bg-red-100 text-red-700 border-red-300 dark:bg-red-500/10 dark:text-red-400";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-500/10 dark:text-yellow-300";
      default:
        return "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-500/10 dark:text-blue-300";
    }
  };

  const getCategoryIcon = (c) => (c === "work" ? "💼" : c === "school" ? "📚" : "🏠");

  // --- RETURN JSX ---
  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        darkMode ? "dark bg-gray-900" : "bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50"
      }`}
    >
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* HEADER */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                My To-Do List
              </h1>
              <p className="text-gray-600 dark:text-gray-400">Stay organized, stay focused</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">{total} tasks</span>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                {darkMode ? "☀️" : "🌙"}
              </button>
            </div>
          </div>
        </div>

        {/* GRID LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-6">
            {/* ADD TASK FORM */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span>➕</span> New Task
              </h2>

              <input
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTask()}
                placeholder="What needs to be done?"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 mb-4"
              />

              <div className="grid grid-cols-2 gap-4 mb-4">
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-lg p-2">
                  <option value="work">💼 Work</option>
                  <option value="personal">🏠 Personal</option>
                  <option value="school">📚 School</option>
                </select>
                <select value={priority} onChange={(e) => setPriority(e.target.value)} className="rounded-lg p-2">
                  <option value="low">🔵 Low</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="high">🔴 High</option>
                </select>
              </div>

              <button
                onClick={addTask}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold"
              >
                Add Task
              </button>
            </div>

            {/* SEARCH / FILTERS */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="🔍 Search tasks..."
                className="w-full mb-4 px-4 py-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-700"
              />
              <div className="flex flex-wrap gap-2">
                {["all", "work", "personal", "school"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    className={`px-4 py-2 rounded-lg ${
                      activeFilter === f
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* TASK LIST */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
              {filteredTasks.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">No tasks found.</p>
              ) : (
                <ul className="space-y-3">
                  {filteredTasks.map((t, i) => (
                    <li
                      key={t.id}
                      draggable
                      onDragStart={() => handleDragStart(i)}
                      onDragOver={(e) => handleDragOver(e, i)}
                      onDragEnd={handleDragEnd}
                      className={`flex justify-between items-center p-3 rounded-xl border ${
                        draggedIndex === i ? "opacity-60" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {t.editing ? (
                          <input
                            defaultValue={t.text}
                            onBlur={(e) => updateTaskText(t.id, e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && updateTaskText(t.id, e.target.value)}
                            autoFocus
                            className="flex-1 px-2 py-1 border rounded"
                          />
                        ) : (
                          <span
                            onClick={() => toggleComplete(t.id)}
                            className={`flex-1 cursor-pointer ${
                              t.completed ? "line-through text-gray-400" : ""
                            }`}
                          >
                            {t.text}
                          </span>
                        )}
                        <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(t.priority)}`}>
                          {t.priority}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-200 dark:bg-gray-600">
                          {getCategoryIcon(t.category)} {t.category}
                        </span>
                      </div>
                      <div className="flex gap-2 ml-2">
                        <button onClick={() => toggleEdit(t.id)}>✏️</button>
                        <button onClick={() => deleteTask(t.id)} className="text-red-500">
                          🗑️
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
              <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <button onClick={markAllCompleted} className="btn-green w-full">
                  Mark all completed
                </button>
                <button onClick={clearCompleted} className="btn-orange w-full">
                  Clear completed
                </button>
                <button onClick={deleteAll} className="btn-red w-full">
                  Delete all
                </button>
                <button onClick={exportJSON} className="btn-blue w-full">
                  Export JSON
                </button>
                <label className="btn-purple w-full cursor-pointer text-center">
                  Import JSON
                  <input type="file" accept=".json" onChange={importJSON} className="hidden" />
                </label>
              </div>
            </div>

            {/* STATS */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
              <h2 className="text-lg font-bold mb-4">Stats</h2>
              <div className="space-y-2">
                <p>Total: {total}</p>
                <p>Completed: {completed}</p>
                <p>Remaining: {remaining}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
