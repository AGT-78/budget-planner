import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";

const sw = new URL("service-worker.js", import.meta.url);
if ("serviceWorker" in navigator) {
  const s = navigator.serviceWorker;
  s.register(sw.href, {
    scope: "/budget-planner/",
  })
    .then((_) =>
      console.log(
        "Service Worker Registered for scope:",
        sw.href,
        "with",
        import.meta.url
      )
    )
    .catch((err) => console.error("Service Worker Error:", err));
}

const firebaseConfig = {
  apiKey: "AIzaSyD5piWLPpu079Ty0iKjcVDibhHnJS3FBXY",
  authDomain: "budget-planner-4a26d.firebaseapp.com",
  projectId: "budget-planner-4a26d",
  storageBucket: "budget-planner-4a26d.firebasestorage.app",
  messagingSenderId: "784453800479",
  appId: "1:784453800479:web:e256b8650f926f7d087b2a",
  measurementId: "G-XN4Y36TCQT",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", () => {
  const budgetForm = document.getElementById("budget-form");
  const capitalAmountInput = document.getElementById("amount");
  const expenseAmountInput = document.getElementById("expense");
  const descriptionInput = document.getElementById("description");
  const categoryInput = document.getElementById("category");
  const expenseList = document.getElementById("expense-history");
  const totalBudgetDisplay = document.getElementById("total-budget");
  const totalExpensesDisplay = document.getElementById("total-expenses");
  const remainingBalanceDisplay = document.getElementById("remaining-balance");

  let totalBudget = 0;
  let totalExpenses = 0;

  // Function to update budget summary
  function updateBudgetSummary() {
    totalBudgetDisplay.textContent = `CA$ ${totalBudget.toFixed(2)}`;
    totalExpensesDisplay.textContent = `CA$ ${totalExpenses.toFixed(2)}`;
    remainingBalanceDisplay.textContent = `CA$ ${(
      totalBudget - totalExpenses
    ).toFixed(2)}`;
  }

  // Function to add expense to Firestore
  async function addExpense(amount, description, category) {
    try {
      await addDoc(collection(db, "expenses"), {
        amount: amount,
        description: description,
        category: category,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error adding expense: ", error);
    }
  }

  // Function to remove expense from Firestore
  async function removeExpense(expenseId, element) {
    try {
      await deleteDoc(doc(db, "expenses", expenseId));
      element.remove();
    } catch (error) {
      console.error("Error deleting expense: ", error);
    }
  }

  // Function to load expenses from Firestore in real-time
  function loadExpenses() {
    const q = query(collection(db, "expenses"), orderBy("timestamp", "desc"));
    onSnapshot(q, (snapshot) => {
      expenseList.innerHTML = "";
      totalExpenses = 0;
      snapshot.forEach((doc) => {
        let expense = doc.data();
        let expenseItem = document.createElement("li");
        expenseItem.innerHTML = `<strong>${
          expense.category
        }</strong> - $${expense.amount.toFixed(2)}<br><small>Spent on ${
          expense.description
        }</small>`;
        expenseItem.addEventListener("click", () =>
          removeExpense(doc.id, expenseItem)
        );
        expenseList.appendChild(expenseItem);
        totalExpenses += expense.amount;
      });
      updateBudgetSummary();
    });
  }

  // Handle form submission
  budgetForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const capitalAmount = parseFloat(capitalAmountInput.value);
    const expenseAmount = parseFloat(expenseAmountInput.value);
    const description = descriptionInput.value.trim();
    const category = categoryInput.value;

    if (isNaN(capitalAmount) || capitalAmount <= 0) {
      alert("Please enter a valid capital amount.");
      return;
    }

    if (isNaN(expenseAmount) || expenseAmount <= 0 || description === "") {
      alert("Please enter valid expense details.");
      return;
    }

    totalBudget = capitalAmount; // Set capital amount as total budget
    await addExpense(expenseAmount, description, category);

    // Clear input fields
    capitalAmountInput.value = "";
    expenseAmountInput.value = "";
    descriptionInput.value = "";
    categoryInput.value = "food";
  });

  // Load expenses on page load
  loadExpenses();
  updateBudgetSummary();
});
