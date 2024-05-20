import { Client, Databases, ID } from 'appwrite';

const client = new Client();
client
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

const DB_ID = import.meta.env.VITE_APPWRITE_DB_ID;
const COLLECTION_ID_TASKS = import.meta.env.VITE_APPWRITE_COLLECTION_ID;
const databases = new Databases(client);

const dailyGoal = 2000;
let totalCalories = 0;
const currentDate = getCurrentDate();

const modal = document.getElementById('myModal');
const btn = document.getElementById('openModalBtn');
const span = document.getElementsByClassName('close')[0];
const foodInput = document.getElementById('food-item');
const calorieInput = document.getElementById('calorie-count');
const tableBody = document.querySelector('#calorie-table tbody');
const totalCaloriesElem = document.getElementById('total-calories');
const progressBar = document.getElementById('progress');

btn.onclick = () => toggleModal(true);
span.onclick = () => toggleModal(false);
window.onclick = (event) => event.target == modal && toggleModal(false);
foodInput.addEventListener('keydown', handleKeyDown);
calorieInput.addEventListener('keydown', handleKeyDown);

function getCurrentDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toggleModal(show) {
  modal.style.display = show ? 'block' : 'none';
}

function handleKeyDown(event) {
  if (event.key === 'Enter') addCalories();
}

function addCalories() {
  const foodItem = foodInput.value.trim();
  const calorieCount = parseInt(calorieInput.value, 10);

  if (!foodItem) return alert('Please enter a food item.');
  if (isNaN(calorieCount) || calorieCount <= 0) return alert('Please enter a valid calorie count.');

  createTableRow(foodItem, calorieCount);
  updateTotalCalories(calorieCount);
  resetInputs();
  toggleModal(false);
  updateProgressBar(calorieCount);
  saveCalorieData(foodItem, calorieCount);
}

function createTableRow(foodItem, calorieCount) {
  const tableRow = document.createElement('tr');
  tableRow.innerHTML = `<td>${foodItem}</td><td>${calorieCount}</td>`;
  tableBody.appendChild(tableRow);
}

function updateTotalCalories(calorieCount) {
  totalCalories += calorieCount;
  totalCaloriesElem.textContent = totalCalories;
}

function resetInputs() {
  foodInput.value = '';
  calorieInput.value = '';
}

function saveCalorieData(foodItem, calorieCount) {
  databases.createDocument(DB_ID, COLLECTION_ID_TASKS, ID.unique(), { food: foodItem, calories: calorieCount })
    .then(response => console.log(response))
    .catch(error => console.log(error));
}

function fetchAndDisplayData() {
  databases.listDocuments(DB_ID, COLLECTION_ID_TASKS)
    .then(response => {
      const documents = response.documents;
      documents.forEach(document => {
        const formattedDate = new Date(document.$createdAt).toISOString().split('T')[0];
        if (formattedDate === currentDate) {
          createTableRow(document.food, document.calories);
          updateTotalCalories(document.calories);
          updateProgressBar(totalCalories);
        }
      });
    })
    .catch(error => console.error('Error fetching data:', error));
}

function updateProgressBar(totalCalories) {
  const circumference = 2 * Math.PI * 90;
  const progress = (totalCalories / dailyGoal) * circumference;
  const remainingCircumference = Math.max(circumference - progress, 0);
   const remainderToFill = remainingCircumference < 0 ? 0 : remainingCircumference;
  progressBar.style.strokeDashoffset = remainderToFill;
}

fetchAndDisplayData();
