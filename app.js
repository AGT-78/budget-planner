import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { GoogleGenerativeAI } from "@google/generative-ai";
import log from "loglevel";

log.info("Budget Planner App initializing...");
// Register service-workers
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

// Firebase Config Credentials
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

// Function to add expense to Firestore database
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

// Function to edit expense in Firestore
async function editExpense(expenseId, newAmount, newDescription, newCategory) {
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

    const expenseRef = doc(db, "expenses", expenseId);
    const expenseSnapshot = await getDoc(expenseRef);

    if (expenseSnapshot.exists()) {
      const deletedAmount = expenseSnapshot.data().amount;

      await deleteDoc(expenseRef);
      element.remove();

      log.info(`Expense with ID ${expenseId} removed successfully`);

      totalExpenses -= deletedAmount;

      await loadExpenses();
      updateBudgetSummary();
    } else {
      log.warn(`Expense with ID ${expenseId} not found.`);
    }
  } catch (error) {
    log.error("Error deleting expense: ", error);
  }
}

// Function to load expenses from Firestore
function loadExpenses() {
  return new Promise((resolve) => {
    log.debug("Loading expenses from Firestore...");
    const q = query(collection(db, "expenses"), orderBy("timestamp", "desc"));

    onSnapshot(q, (snapshot) => {
      expenseList.innerHTML = "";
      let updatedTotalExpenses = 0;

      snapshot.forEach((doc) => {
        let expense = doc.data();
        log.debug("Fetched Expense:", expense);

        let expenseItem = document.createElement("li");
        expenseItem.innerHTML = `<strong>${
          expense.category
        }</strong>  $${expense.amount.toFixed(2)}
                                 <br><small>${expense.description}</small>`;

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

        updatedTotalExpenses += expense.amount;
      });

      totalExpenses = updatedTotalExpenses;
      resolve();
    });
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

  if (isNaN(expenseAmount) || expenseAmount <= 0) {
    log.warn("Invalid expense amount entered:", {
      expenseAmount,
    });
    alert("Please enter a valid expense amount.");
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
  await loadExpenses();
  updateBudgetSummary();

  // Clear the input fields
  capitalAmountInput.value = "";
  expenseAmountInput.value = "";
  descriptionInput.value = "";
  categoryInput.value = "food";
  log.info("Expense added and form cleared");
});

// Load expenses on page load
loadExpenses();
updateBudgetSummary();

// Chat Bot Integration
let genAI;
let model;

// Fetch API Key from Firestore
async function getApiKey() {
  let snapshot = await getDoc(doc(db, "apikey", "googlegenai"));
  const apiKey = snapshot.data().key;

  genAI = new GoogleGenerativeAI(apiKey);
  model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
}
getApiKey();

// Chatbot response handler
async function askChatBot(request) {
  if (!model) {
    appendMessage("Chatbot is still initializing. Please wait...");
    return;
  }

  try {
    log.debug("Sending request to Gemini AI:", request);

    let response = await model.generateContent(request);
    let aiReply =
      response?.candidates?.[0]?.content ||
      "Sorry, I didn't understand that...";

    log.info("AI Response:", aiReply);
    appendMessage(`Bot: ${aiReply}`);
  } catch (error) {
    log.error("Chatbot API Error:", error);
    appendMessage("Error: Unable to process chatbot request.");
  }
}

// Chatbot Command Processor
function ruleChatBot(request) {
  request = request.toLowerCase().trim();

  // Handle "Add expense" command
  if (request.startsWith("add expense")) {
    let parts = request.replace("add expense", "").trim().split(" ");

    if (parts.length < 2) {
      appendMessage(
        "Invalid format. Use: 'Add Expense (amount) (description)'"
      );
      return true;
    }

    let amount = parseFloat(parts[0]);
    let description = parts.slice(1).join(" ");

    if (isNaN(amount) || amount <= 0) {
      appendMessage("Please provide a valid number.");
      return true;
    }

    // Ensure function is correctly called
    if (typeof addExpense === "function") {
      addExpense(amount, description, "Miscellaneous")
        .then(() => loadExpenses())
        .then(() => updateBudgetSummary());

      appendMessage(`Expense of CA$ ${amount} added for "${description}"`);
    } else {
      console.error("addExpense function is not defined!");
      appendMessage("Error: Could not add expense.");
    }

    return true;
  }

  // Handle "Show balance" command
  if (request.startsWith("show balance")) {
    appendMessage(
      `Your remaining balance is: CA$ ${(totalBudget - totalExpenses).toFixed(
        2
      )}`
    );
    return true;
  }

  return false;
}

// Event listener for chatbot messages
document.getElementById("send-btn").addEventListener("click", async () => {
  let userInput = document.getElementById("chat-input").value.trim();

  if (userInput) {
    appendMessage(`User: ${userInput}`);

    if (!ruleChatBot(userInput)) {
      await askChatBot(userInput);
    }
  } else {
    appendMessage("Please enter a message.");
  }

  document.getElementById("chat-input").value = "";
});

// Display chatbot messages
function appendMessage(message) {
  let history = document.createElement("div");
  history.textContent = message;
  history.className = "history";
  document.getElementById("chat-history").appendChild(history);
}

// Global error logging
window.addEventListener("error", function (event) {
  log.error("Global Error occurred: ", event.message);
});
