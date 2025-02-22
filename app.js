import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import log from "loglevel";

log.info("Budget Planner App initializing...");

const sw = new URL("service-worker.js", import.meta.url);
if ("serviceWorker" in navigator) {
  const s = navigator.serviceWorker;
  s.register(sw.href, {
    scope: "/budget-planner/",
  })
    .then((_) =>
      log.info(
        "Service Worker Registered for scope:",
        sw.href,
        "with",
        import.meta.url
      )
    )
    .catch((err) => log.error("Service Worker Error:", err));
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
log.info("Firebase initialized");

document.addEventListener("DOMContentLoaded", () => {
  log.info("DOM fully loaded, initializing budget planner...");
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
    log.debug("Updating budget summary...");
    totalBudgetDisplay.textContent = `CA$ ${totalBudget.toFixed(2)}`;
    totalExpensesDisplay.textContent = `CA$ ${totalExpenses.toFixed(2)}`;
    remainingBalanceDisplay.textContent = `CA$ ${(
      totalBudget - totalExpenses
    ).toFixed(2)}`;
    log.info("Budget Updated");
  }

  // Function to add expense to Firestore
  async function addExpense(amount, description, category) {
    try {
      log.debug("Adding expense to Firestore:", {
        amount,
        description,
        category,
      });
      await addDoc(
        collection(db, "expenses"),
        {
          amount: amount,
          description: description,
          category: category,
          timestamp: serverTimestamp(),
        },
        log.info("Expense added successfully")
      );
    } catch (error) {
      log.error("Error adding expense: ", error);
    }
  }

  // Function to edit an expense in Firestore
  async function editExpense(
    expenseId,
    newAmount,
    newDescription,
    newCategory
  ) {
    try {
      await updateDoc(doc(db, "expenses", expenseId), {
        amount: newAmount,
        description: newDescription,
        category: newCategory,
      });
      log.info("Expense updated successfully");
    } catch (error) {
      log.error("Error updating expense: ", error);
    }
  }

  // Function to remove expense from Firestore
  async function removeExpense(expenseId, element) {
    try {
      log.debug("Removing expense:", expenseId);
      await deleteDoc(doc(db, "expenses", expenseId));
      element.remove();
      log.info(`Expense with ID ${expenseId} removed successfully`);
    } catch (error) {
      log.error("Error deleting expense: ", error);
    }
  }

  // Function to load expenses from Firestore in real-time
  function loadExpenses() {
    log.info("Loading expenses from Firestore...");
    const q = query(collection(db, "expenses"), orderBy("timestamp", "desc"));
    onSnapshot(q, (snapshot) => {
      expenseList.innerHTML = "";
      let totalExpenses = 0;
      snapshot.forEach((doc) => {
        let expense = doc.data();
        log.debug("Fetched Expense:", expense);
        let expenseItem = document.createElement("li");
        expenseItem.innerHTML = `<strong>${
          expense.category
        }</strong> - $${expense.amount.toFixed(2)}<br><small>Spent on ${
          expense.description
        }</small>`;

        let editButton = document.createElement("button");
        editButton.className = "btn";
        editButton.textContent = "Edit";
        editButton.addEventListener("click", () => {
          let newAmount = parseFloat(
            prompt("Enter new amount:", expense.amount)
          );
          let newDescription = prompt(
            "Enter new description:",
            expense.description
          );
          let newCategory = prompt("Enter new category:", expense.category);

          if (
            !isNaN(newAmount) &&
            newAmount > 0 &&
            newDescription.trim() !== ""
          ) {
            editExpense(doc.id, newAmount, newDescription, newCategory);
          } else {
            alert("Invalid input, please try again.");
          }
        });

        let deleteButton = document.createElement("button");
        deleteButton.className = "btn";
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener("click", () =>
          removeExpense(doc.id, expenseItem)
        );

        expenseItem.appendChild(editButton);
        expenseItem.appendChild(deleteButton);
        expenseList.appendChild(expenseItem);
        totalExpenses += expense.amount;
      });
      updateBudgetSummary(0, totalExpenses);
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
      log.warn("Invalid capital amount entered:", capitalAmount);
      alert("Please enter a valid capital amount.");
      return;
    }

    if (isNaN(expenseAmount) || expenseAmount <= 0 || description === "") {
      log.warn("Invalid expense details entered:", {
        expenseAmount,
        description,
      });
      alert("Please enter valid expense details.");
      return;
    }

    log.info("Adding new expense:", {
      capitalAmount,
      expenseAmount,
      description,
      category,
    });

    totalBudget = capitalAmount;
    await addExpense(expenseAmount, description, category);

    // Clear input fields
    capitalAmountInput.value = "";
    expenseAmountInput.value = "";
    descriptionInput.value = "";
    categoryInput.value = "food";
    log.info("Expense added and form cleared");
  });

  // Load expenses on page load
  loadExpenses();
  updateBudgetSummary();
});

// Global error logging
window.addEventListener("error", function (event) {
  log.error("Global Error occurred: ", event.message);
});
