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
  let expenses = [];

  // Function to update budget summary
  function updateBudgetSummary() {
    totalBudgetDisplay.textContent = `CA$ ${totalBudget.toFixed(2)}`;
    totalExpensesDisplay.textContent = `CA$ ${totalExpenses.toFixed(2)}`;
    remainingBalanceDisplay.textContent = `CA$ ${(
      totalBudget - totalExpenses
    ).toFixed(2)}`;
  }

  // Function to add expense
  function addExpense(amount, description, category) {
    const expenseItem = document.createElement("li");
    expenseItem.innerHTML = `<strong>${category}</strong>  $${amount.toFixed(
      2
    )}<br><small>Spent on ${description}</small>`;
    expenseItem.addEventListener("click", () =>
      removeExpense(amount, expenseItem)
    );

    expenseList.appendChild(expenseItem);

    expenses.push({ amount, description, category });
    totalExpenses += amount;
    updateBudgetSummary();
  }

  // Function to remove expense
  function removeExpense(amount, element) {
    totalExpenses -= amount;
    expenseList.removeChild(element);
    updateBudgetSummary();
  }

  // Handle form submission
  budgetForm.addEventListener("submit", (event) => {
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
    addExpense(expenseAmount, description, category);

    // Clear input fields
    capitalAmountInput.value = "";
    expenseAmountInput.value = "";
    descriptionInput.value = "";
    categoryInput.value = "food";
  });

  // Initialize budget summary
  updateBudgetSummary();
});
