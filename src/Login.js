import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as XLSX from "xlsx";
import "./Login.css";
import { useState, useEffect, useCallback } from "react";

import {
  getFirestore,
  addDoc,
  collection,
  deleteDoc,
  doc,
  updateDoc,
  query,
  where,
  onSnapshot
} from "firebase/firestore";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";

import { Bar, Pie } from "react-chartjs-2";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth";

import app from "./firebase";

const auth = getAuth(app);
const db = getFirestore(app);

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [subject, setSubject] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [excelData, setExcelData] = useState([]);
  const [search, setSearch] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [activePage, setActivePage] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [examDate, setExamDate] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [studyPlan, setStudyPlan] = useState([]);
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState([]);
  const [editNoteId, setEditNoteId] = useState(null);
  const [streak, setStreak] = useState(0);
  const [task, setTask] = useState("");
  const [tasks, setTasks] = useState([]);
  const [teamName, setTeamName] = useState("");
  const [teams, setTeams] = useState([]);
  const [editTeamId, setEditTeamId] = useState(null);
  const [memberEmail, setMemberEmail] = useState("");
  const [teamMessages, setTeamMessages] = useState({});
  const [messageText, setMessageText] = useState("");

  const signup = () => {
    createUserWithEmailAndPassword(auth, email, password)
      .then(() => toast.success("Signup Success"))
      .catch((err) => toast.error(err.message));
  };

  const login = () => {
    setLoading(true);

    signInWithEmailAndPassword(auth, email, password)
      .then(() => {
        toast.success("Login Success");
        setLoading(false);
      })
      .catch((err) => {
        toast.error(err.message);
        setLoading(false);
      });
  };

  const logout = () => {
    signOut(auth)
      .then(() => {
        toast.info("Logged Out");
        setSubjects([]);
        setNotes([]);
        setTasks([]);
      })
      .catch((err) => toast.error(err.message));
  };

  const addSubject = () => {
    if (!auth.currentUser) return toast.error("Please login first");
    if (!subject.trim()) return toast.error("Please enter subject");

    addDoc(collection(db, "subjects"), {
      name: subject,
      completed: false,
      userId: auth.currentUser.uid,
      createdAt: new Date()
    })
      .then(() => {
        setSubject("");
        toast.success("Subject Added");
      })
      .catch((err) => toast.error(err.message));
  };

  const addTask = () => {
    if (!auth.currentUser) return toast.error("Please login first");
    if (!task.trim()) return toast.error("Please enter task");

    addDoc(collection(db, "tasks"), {
      text: task,
      completed: false,
      userId: auth.currentUser.uid,
      createdAt: new Date()
    })
      .then(() => {
        setTask("");
        toast.success("Task Added");
      })
      .catch((err) => toast.error(err.message));
  };
  const createTeam = () => {
  if (!auth.currentUser) {
    toast.error("Please login first");
    return;
  }

  if (!teamName.trim()) {
    toast.error("Please enter team name");
    return;
  }

  addDoc(collection(db, "teams"), {
    name: teamName,
    ownerId: auth.currentUser.uid,
    ownerEmail: auth.currentUser.email,
    members: [auth.currentUser.email],
    createdAt: new Date()
  })
    .then(() => {
      setTeamName("");
      toast.success("Team Created");
    })
    .catch((err) => toast.error(err.message));
};
const deleteTeam = async (id) => {
  await deleteDoc(doc(db, "teams", id));

  toast.info("Team Deleted");
};

const startEditTeam = (team) => {
  setEditTeamId(team.id);
  setTeamName(team.name);
};

const updateTeam = async () => {
  if (!teamName.trim()) {
    toast.error("Please enter team name");
    return;
  }

  await updateDoc(doc(db, "teams", editTeamId), {
    name: teamName,
    updatedAt: new Date()
  });

  setTeamName("");
  setEditTeamId(null);

  toast.success("Team Updated");
};
const addMemberToTeam = async (team) => {
  if (!memberEmail.trim()) {
    toast.error("Please enter member email");
    return;
  }

  const updatedMembers = [
    ...(team.members || []),
    memberEmail
  ];

  await updateDoc(doc(db, "teams", team.id), {
    members: updatedMembers
  });

  setMemberEmail("");
  toast.success("Member Added");
};
const sendTeamMessage = async (teamId) => {
  if (!auth.currentUser) {
    toast.error("Please login first");
    return;
  }

  if (!messageText.trim()) {
    toast.error("Please enter message");
    return;
  }

  await addDoc(
    collection(db, "teams", teamId, "messages"),
    {
      text: messageText,
      sender: auth.currentUser.email,
      createdAt: new Date()
    }
  );

  setMessageText("");
};
const getTeamMessages = (teamId) => {
  return onSnapshot(
    collection(db, "teams", teamId, "messages"),
    (snapshot) => {
      let list = [];

      snapshot.forEach((docItem) => {
        list.push({
          id: docItem.id,
          ...docItem.data()
        });
      });

      setTeamMessages((prev) => ({
        ...prev,
        [teamId]: list
      }));
    }
  );
};
  const toggleTask = async (item) => {
    await updateDoc(doc(db, "tasks", item.id), {
      completed: !item.completed
    });
  };

  const deleteTask = async (id) => {
    await deleteDoc(doc(db, "tasks", id));
    toast.info("Task Deleted");
  };

  const addNote = () => {
    if (!auth.currentUser) return toast.error("Please login first");
    if (!note.trim()) return toast.error("Please write a note");

    addDoc(collection(db, "notes"), {
      text: note,
      userId: auth.currentUser.uid,
      createdAt: new Date()
    })
      .then(() => {
        setNote("");
        toast.success("Note Added");
      })
      .catch((err) => toast.error(err.message));
  };

  const deleteNote = async (id) => {
    await deleteDoc(doc(db, "notes", id));
    toast.info("Note Deleted");
  };

  const startEditNote = (item) => {
    setEditNoteId(item.id);
    setNote(item.text);
  };

  const updateNote = async () => {
    if (!note.trim()) return toast.error("Please write a note");

    await updateDoc(doc(db, "notes", editNoteId), {
      text: note,
      updatedAt: new Date()
    });

    setNote("");
    setEditNoteId(null);
    toast.success("Note Updated");
  };

  const getSubjects = useCallback(() => {
    if (!auth.currentUser) return null;

    const q = query(
      collection(db, "subjects"),
      where("userId", "==", auth.currentUser.uid)
    );

    return onSnapshot(q, (querySnapshot) => {
      let list = [];

      querySnapshot.forEach((docItem) => {
        list.push({
          id: docItem.id,
          ...docItem.data()
        });
      });

      setSubjects(list);
    });
  }, []);

  const getNotes = useCallback(() => {
    if (!auth.currentUser) return null;

    const q = query(
      collection(db, "notes"),
      where("userId", "==", auth.currentUser.uid)
    );

    return onSnapshot(q, (querySnapshot) => {
      let list = [];

      querySnapshot.forEach((docItem) => {
        list.push({
          id: docItem.id,
          ...docItem.data()
        });
      });

      setNotes(list);
    });
  }, []);

  const getTasks = useCallback(() => {
    if (!auth.currentUser) return null;

    const q = query(
      collection(db, "tasks"),
      where("userId", "==", auth.currentUser.uid)
    );

    return onSnapshot(q, (querySnapshot) => {
      let list = [];

      querySnapshot.forEach((docItem) => {
        list.push({
          id: docItem.id,
          ...docItem.data()
        });
      });

      setTasks(list);
    });
  }, []);
  const getTeams = useCallback(() => {
  if (!auth.currentUser) return null;

  const q = query(
    collection(db, "teams"),
    where("members", "array-contains", auth.currentUser.email)
  );

  return onSnapshot(q, (querySnapshot) => {
    let list = [];

    querySnapshot.forEach((docItem) => {
      list.push({
        id: docItem.id,
        ...docItem.data()
      });
    });
list.forEach((team) => {
  getTeamMessages(team.id);
});
    setTeams(list);
  });
}, []);
  const deleteSubject = async (id) => {
    await deleteDoc(doc(db, "subjects", id));
    toast.info("Subject Deleted");
  };

  const toggleComplete = async (item) => {
    await updateDoc(doc(db, "subjects", item.id), {
      completed: !item.completed
    });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (event) => {
      const result = event.target?.result;
      if (!result) return;

      const data = new Uint8Array(result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      setExcelData(XLSX.utils.sheet_to_json(worksheet));
      toast.success("Excel Uploaded");
    };

    reader.readAsArrayBuffer(file);
  };

  const exportExcel = () => {
    if (excelData.length === 0) {
      return toast.error("Please upload Excel first");
    }

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Marks");
    XLSX.writeFile(workbook, "Marks_Report.xlsx");
  };

  const exportPDF = () => {
    if (excelData.length === 0) {
      return toast.error("Please upload Excel first");
    }

    const docPdf = new jsPDF();

    docPdf.text("Marks Report", 20, 20);

    autoTable(docPdf, {
      startY: 30,
      head: [["Subject", "Marks"]],
      body: excelData.map((item) => [item.Subject, item.Marks])
    });

    docPdf.save("Marks_Report.pdf");
  };

  const generateStudyPlan = () => {
    if (!subject.trim()) return toast.error("Please enter subject first");
    if (!examDate) return toast.error("Please select exam date");

    const daysLeft = Math.ceil(
      (new Date(examDate) - new Date()) / (1000 * 60 * 60 * 24)
    );

    if (daysLeft <= 0) {
      return toast.error("Please select future exam date");
    }

    const plan = [];

    for (let i = 1; i <= Math.min(daysLeft, 7); i++) {
      plan.push({
        day: `Day ${i}`,
        task: `${subject} - Study ${i * 2} topics + revise notes`
      });
    }

    setStudyPlan(plan);
    toast.success("Study Plan Generated");
  };

  const completedCount = subjects.filter((item) => item.completed).length;

  const progress =
    subjects.length > 0
      ? Math.round((completedCount / subjects.length) * 100)
      : 0;

  const totalSubjects = subjects.length;

  const completedSubjects = subjects.filter((item) => item.completed).length;

  const pendingSubjects = totalSubjects - completedSubjects;

  const totalMarks = excelData.reduce(
    (sum, item) => sum + Number(item.Marks || 0),
    0
  );

  const averageMarks =
    excelData.length > 0 ? (totalMarks / excelData.length).toFixed(2) : 0;

  let grade = "F";

  if (Number(averageMarks) >= 90) {
    grade = "A+";
  } else if (Number(averageMarks) >= 75) {
    grade = "A";
  } else if (Number(averageMarks) >= 60) {
    grade = "B";
  } else if (Number(averageMarks) >= 40) {
    grade = "C";
  }

  const filteredSubjects = subjects.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const chartData = {
    labels: excelData.map((item) => item.Subject),

    datasets: [
      {
        label: "Marks",
        data: excelData.map((item) => item.Marks),
        backgroundColor: "#2563eb"
      }
    ]
  };

  const pieData = {
    labels: ["Completed", "Pending"],

    datasets: [
      {
        data: [completedSubjects, pendingSubjects],
        backgroundColor: ["#22c55e", "#ef4444"]
      }
    ]
  };

  const remainingDays = examDate
    ? Math.ceil((new Date(examDate) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  const userEmail = auth.currentUser?.email || "No Email";
  const notesCount = notes.length;
  const tasksCount = tasks.length;

  useEffect(() => {
    let unsubscribeSubjects = null;
    let unsubscribeNotes = null;
    let unsubscribeTasks = null;
    let unsubscribeTeams = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        unsubscribeSubjects = getSubjects();
        unsubscribeNotes = getNotes();
        unsubscribeTasks = getTasks();
        unsubscribeTeams = getTeams();
      } else {
        setSubjects([]);
        setNotes([]);
        setTasks([]);
        setTeams([]);
      }
    });

    return () => {
      unsubscribeAuth();

      if (unsubscribeSubjects) unsubscribeSubjects();
      if (unsubscribeNotes) unsubscribeNotes();
      if (unsubscribeTasks) unsubscribeTasks();
      if (unsubscribeTeams) unsubscribeTeams();
    };
  }, [
  getSubjects,
  getNotes,
  getTasks,
  getTeams
]);

  useEffect(() => {
    const savedDate = localStorage.getItem("lastVisit");
    const savedStreak = Number(localStorage.getItem("streak")) || 0;
    const today = new Date().toDateString();

    if (savedDate !== today) {
      localStorage.setItem("lastVisit", today);
      localStorage.setItem("streak", savedStreak + 1);
      setStreak(savedStreak + 1);
    } else {
      setStreak(savedStreak);
    }
  }, []);

  return (
    <>
      <button
        className="menu-btn"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        ☰
      </button>

      <div className="main-layout">
        <div className={sidebarOpen ? "sidebar active-sidebar" : "sidebar"}>
          <h2 className="logo">📚 Tracker</h2>

          <ul className="sidebar-menu">
            <li
              className={activePage === "dashboard" ? "active-menu" : ""}
              onClick={() => setActivePage("dashboard")}
            >
              🏠 Dashboard
            </li>
            <li
  className={activePage === "teams" ? "active-menu" : ""}
  onClick={() => setActivePage("teams")}
>
  👥 Teams
</li>
            <li
              className={activePage === "subjects" ? "active-menu" : ""}
              onClick={() => setActivePage("subjects")}
            >
              📘 Subjects
            </li>

            <li
              className={activePage === "tasks" ? "active-menu" : ""}
              onClick={() => setActivePage("tasks")}
            >
              📅 Tasks
            </li>

            <li
              className={activePage === "notes" ? "active-menu" : ""}
              onClick={() => setActivePage("notes")}
            >
              📝 Notes
            </li>

            <li
              className={activePage === "analytics" ? "active-menu" : ""}
              onClick={() => setActivePage("analytics")}
            >
              📊 Analytics
            </li>

            <li
              className={activePage === "profile" ? "active-menu" : ""}
              onClick={() => setActivePage("profile")}
            >
              👤 Profile
            </li>

            <li onClick={() => setDarkMode(!darkMode)}>
              🌙 Theme
            </li>
          </ul>
        </div>

        <div
          className="app-container"
          style={{
            backgroundColor: darkMode ? "#111827" : "#f3f4f6",
            color: darkMode ? "white" : "black",
            minHeight: "100vh",
            transition: "0.3s"
          }}
        >
          <div
            className="card"
            style={{
              backgroundColor: darkMode ? "#1f2937" : "white",
              color: darkMode ? "white" : "black",
              transition: "0.3s"
            }}
          >
            {activePage === "dashboard" && (
              <>
                <h2>Syllabus Tracker</h2>

                <div className="dashboard-cards">
                  <div className="dashboard-card">
                    <h3>Total</h3>
                    <p>{totalSubjects}</p>
                  </div>

                  <div className="dashboard-card">
                    <h3>Completed</h3>
                    <p>{completedSubjects}</p>
                  </div>

                  <div className="dashboard-card">
                    <h3>Pending</h3>
                    <p>{pendingSubjects}</p>
                  </div>

                  <div className="dashboard-card">
                    <h3>Average</h3>
                    <p>{averageMarks}</p>
                  </div>

                  <div className="dashboard-card">
                    <h3>Grade</h3>
                    <p>{grade}</p>
                  </div>

                  <div className="dashboard-card">
                    <h3>🔥 Streak</h3>
                    <p>{streak} Days</p>
                  </div>
                </div>

                <h3>Progress: {progress}% Completed</h3>

                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>

                <input
                  className="input"
                  type="email"
                  placeholder="Enter Email"
                  onChange={(e) => setEmail(e.target.value)}
                />

                <input
                  className="input"
                  type="password"
                  placeholder="Enter Password"
                  onChange={(e) => setPassword(e.target.value)}
                />

                <input
                  className="input"
                  type="text"
                  placeholder="Enter Subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />

                {loading && (
                  <h3 style={{ color: "#2563eb" }}>
                    Loading...
                  </h3>
                )}

                <div>
                  <button className="button signup" onClick={signup}>
                    Signup
                  </button>

                  <button className="button login" onClick={login}>
                    Login
                  </button>

                  <button className="button add" onClick={addSubject}>
                    Add Subject
                  </button>

                  <button className="button logout" onClick={logout}>
                    Logout
                  </button>

                  <button className="button add" onClick={generateStudyPlan}>
                    Generate Study Plan
                  </button>

                  <button className="button signup" onClick={exportExcel}>
                    Export Excel
                  </button>

                  <button className="button logout" onClick={exportPDF}>
                    Export PDF
                  </button>
                </div>

                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="input"
                />

                <input
                  className="input"
                  type="text"
                  placeholder="Search Subject"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />

                <input
                  type="date"
                  className="input"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                />

                {remainingDays !== null && (
                  <div
                    style={{
                      marginTop: "20px",
                      padding: "15px",
                      borderRadius: "10px",
                      background: "#2563eb",
                      color: "white",
                      textAlign: "center"
                    }}
                  >
                    <h3>⏳ {remainingDays} Days Left</h3>
                  </div>
                )}

                {studyPlan.length > 0 && (
                  <div style={{ marginTop: "20px" }}>
                    <h3>🧠 AI Study Plan</h3>

                    {studyPlan.map((item, index) => (
                      <div
                        key={index}
                        style={{
                          padding: "12px",
                          margin: "10px 0",
                          borderRadius: "10px",
                          background: "#e0f2fe",
                          color: "black"
                        }}
                      >
                        <strong>{item.day}</strong>
                        <p>{item.task}</p>
                      </div>
                    ))}
                  </div>
                )}

                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    marginTop: "20px"
                  }}
                >
                  {filteredSubjects.length > 0 ? (
                    filteredSubjects.map((item) => (
                      <li className="subject-item" key={item.id}>
                        <div className="subject-left">
                          <input
                            type="checkbox"
                            checked={item.completed || false}
                            onChange={() => toggleComplete(item)}
                          />

                          <span
                            style={{
                              textDecoration: item.completed
                                ? "line-through"
                                : "none",
                              color: "black"
                            }}
                          >
                            {item.name}
                          </span>
                        </div>

                        <button
                          className="button delete"
                          onClick={() => deleteSubject(item.id)}
                        >
                          Delete
                        </button>
                      </li>
                    ))
                  ) : (
                    <p style={{ textAlign: "center", opacity: 0.7 }}>
                      No Subjects Found 📚
                    </p>
                  )}
                </ul>

                {excelData.length > 0 && (
                  <>
                    <div
                      style={{
                        marginTop: "20px",
                        padding: "15px",
                        backgroundColor: "#f3f4f6",
                        borderRadius: "10px",
                        color: "black"
                      }}
                    >
                      <h3>Marks Analytics</h3>

                      <p>
                        <strong>Total Subjects:</strong> {excelData.length}
                      </p>

                      <p>
                        <strong>Average Marks:</strong> {averageMarks}
                      </p>

                      <p>
                        <strong>Grade:</strong> {grade}
                      </p>
                    </div>

                    <table
                      style={{
                        width: "100%",
                        marginTop: "20px",
                        borderCollapse: "collapse"
                      }}
                    >
                      <thead>
                        <tr
                          style={{
                            backgroundColor: "#2563eb",
                            color: "white"
                          }}
                        >
                          <th style={{ padding: "10px" }}>Subject</th>
                          <th style={{ padding: "10px" }}>Marks</th>
                        </tr>
                      </thead>

                      <tbody>
                        {excelData.map((item, index) => (
                          <tr key={index}>
                            <td
                              style={{
                                padding: "10px",
                                border: "1px solid #ccc"
                              }}
                            >
                              {item.Subject}
                            </td>

                            <td
                              style={{
                                padding: "10px",
                                border: "1px solid #ccc"
                              }}
                            >
                              {item.Marks}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div style={{ marginTop: "30px" }}>
                      <h3>Marks Chart</h3>
                      <Bar data={chartData} />
                    </div>
                  </>
                )}
              </>
            )}

            {activePage === "subjects" && (
              <div>
                <h2>📘 Subjects</h2>

                <ul style={{ listStyle: "none", padding: 0 }}>
                  {filteredSubjects.length > 0 ? (
                    filteredSubjects.map((item) => (
                      <li key={item.id} className="subject-item">
                        {item.name}
                      </li>
                    ))
                  ) : (
                    <p>No Subjects Found 📚</p>
                  )}
                </ul>
              </div>
            )}

            {activePage === "tasks" && (
              <div>
                <h2>📅 Daily Tasks</h2>

                <input
                  className="input"
                  type="text"
                  placeholder="Enter Task"
                  value={task}
                  onChange={(e) => setTask(e.target.value)}
                />

                <button className="button add" onClick={addTask}>
                  Add Task
                </button>

                <div style={{ marginTop: "20px" }}>
                  {tasks.length > 0 ? (
                    tasks.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          background: "#f3f4f6",
                          color: "black",
                          padding: "15px",
                          borderRadius: "10px",
                          marginBottom: "10px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center"
                        }}
                      >
                        <div>
                          <input
                            type="checkbox"
                            checked={item.completed || false}
                            onChange={() => toggleTask(item)}
                          />

                          <span
                            style={{
                              marginLeft: "10px",
                              textDecoration: item.completed
                                ? "line-through"
                                : "none"
                            }}
                          >
                            {item.text}
                          </span>
                        </div>

                        <button
                          className="button delete"
                          onClick={() => deleteTask(item.id)}
                        >
                          Delete
                        </button>
                      </div>
                    ))
                  ) : (
                    <p>No Tasks Found 📅</p>
                  )}
                </div>
              </div>
            )}

            {activePage === "notes" && (
              <div>
                <h2>📝 Notes</h2>

                <textarea
                  className="input"
                  placeholder="Write your note..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows="4"
                ></textarea>

                {editNoteId ? (
                  <button className="button add" onClick={updateNote}>
                    Update Note
                  </button>
                ) : (
                  <button className="button add" onClick={addNote}>
                    Add Note
                  </button>
                )}

                <div style={{ marginTop: "20px" }}>
                  {notes.length > 0 ? (
                    notes.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          background: "#f3f4f6",
                          color: "black",
                          padding: "15px",
                          borderRadius: "10px",
                          marginBottom: "10px"
                        }}
                      >
                        <p>{item.text}</p>

                        <button
                          className="button login"
                          onClick={() => startEditNote(item)}
                        >
                          Edit
                        </button>

                        <button
                          className="button delete"
                          onClick={() => deleteNote(item.id)}
                        >
                          Delete
                        </button>
                      </div>
                    ))
                  ) : (
                    <p>No Notes Found 📝</p>
                  )}
                </div>
              </div>
            )}

            {activePage === "analytics" && (
              <div>
                <h2>📊 Analytics</h2>

                {excelData.length > 0 ? (
                  <>
                    <Bar data={chartData} />

                    <div style={{ marginTop: "30px" }}>
                      <Pie data={pieData} />
                    </div>
                  </>
                ) : (
                  <p>No Excel Data Uploaded</p>
                )}
              </div>
            )}

            {activePage === "profile" && (
              <div>
                <h2>👤 User Profile</h2>

                <div className="dashboard-cards">
                  <div className="dashboard-card">
                    <h3>Email</h3>
                    <p style={{ fontSize: "14px", wordBreak: "break-word" }}>
                      {userEmail}
                    </p>
                  </div>

                  <div className="dashboard-card">
                    <h3>Total Subjects</h3>
                    <p>{totalSubjects}</p>
                  </div>

                  <div className="dashboard-card">
                    <h3>Completed</h3>
                    <p>{completedSubjects}</p>
                  </div>

                  <div className="dashboard-card">
                    <h3>Notes</h3>
                    <p>{notesCount}</p>
                  </div>

                  <div className="dashboard-card">
                    <h3>Tasks</h3>
                    <p>{tasksCount}</p>
                  </div>

                  <div className="dashboard-card">
                    <h3>Progress</h3>
                    <p>{progress}%</p>
                  </div>

                  <div className="dashboard-card">
                    <h3>🔥 Streak</h3>
                    <p>{streak} Days</p>
                  </div>
                </div>
              </div>
            )}
            {activePage === "teams" && (
  <div>
    <h2>👥 Team Collaboration</h2>

    <input
      className="input"
      type="text"
      placeholder="Enter Team Name"
      value={teamName}
      onChange={(e) => setTeamName(e.target.value)}
    />

    {editTeamId ? (
  <button
    className="button add"
    onClick={updateTeam}
  >
    Update Team
  </button>
) : (
  <button
    className="button add"
    onClick={createTeam}
  >
    Create Team
  </button>
)}

    <div style={{ marginTop: "20px" }}>
      {teams.length > 0 ? (
        teams.map((team) => (
          <div
            key={team.id}
            style={{
              background: "#f3f4f6",
              color: "black",
              padding: "15px",
              borderRadius: "10px",
              marginBottom: "10px"
            }}
          >
            <h3>{team.name}</h3>
            <p>Owner: {team.ownerEmail}</p>
            <p>Members: {team.members?.join(", ")}</p>
            <input
  className="input"
  type="email"
  placeholder="Enter member email"
  value={memberEmail}
  onChange={(e) => setMemberEmail(e.target.value)}
/>

<button
  className="button add"
  onClick={() => addMemberToTeam(team)}
>
  Add Member
</button>
<div style={{ marginTop: "15px" }}>
  <h4>💬 Team Chat</h4>

  <input
    className="input"
    type="text"
    placeholder="Write message..."
    value={messageText}
    onChange={(e) => setMessageText(e.target.value)}
  />

  <button
    className="button login"
    onClick={() => sendTeamMessage(team.id)}
  >
    Send
  </button>

  <div style={{ marginTop: "10px" }}>
    {(teamMessages[team.id] || []).map((msg) => (
      <div
        key={msg.id}
        style={{
          background: "#e0f2fe",
          padding: "10px",
          borderRadius: "8px",
          marginBottom: "8px"
        }}
      >
        <strong>{msg.sender}</strong>
        <p>{msg.text}</p>
      </div>
    ))}
  </div>
</div>
            <button
  className="button login"
  onClick={() => startEditTeam(team)}
>
  Edit
</button>

<button
  className="button delete"
  onClick={() => deleteTeam(team.id)}
>
  Delete
</button>
          </div>
        ))
      ) : (
        <p>No Teams Found 👥</p>
      )}
    </div>
  </div>
)}
          </div>
        </div>
      </div>

      <ToastContainer position="top-right" />
    </>
  );
}

export default Login;