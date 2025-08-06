// =============================
// DOM Elements
// =============================
const userTable = document.getElementById("userTable").querySelector("tbody");
const loading = document.getElementById("loading");
const prevPage = document.getElementById("prevPage");
const nextPage = document.getElementById("nextPage");
const currentPageDisplay = document.getElementById("currentPage");
const searchBar = document.getElementById("searchBar");

const editModal = document.getElementById("editModal");
const editName = document.getElementById("editName");
const editEmail = document.getElementById("editEmail");
const saveEdit = document.getElementById("saveEdit");
const closeModal = document.getElementById("closeModal");
const addUserBtn = document.getElementById("addUserBtn");

let currentPage = 1;
let usersData = [];
let originalUsers = [];
let addedUsers = [];
let editingUserId = null;



// ✅ Global API Key
const API_KEY = "reqres-free-v1";

// =============================
// Fetch Users (Original API)
// =============================
async function fetchOriginalUsers() {
  loading.classList.remove("hidden");
  try {
    const page1 = await fetch(`https://reqres.in/api/users?page=1`);
    const page2 = await fetch(`https://reqres.in/api/users?page=2`);
    const data1 = await page1.json();
    const data2 = await page2.json();

    // Save original API users to localStorage only once
    originalUsers = [...data1.data, ...data2.data];
    localStorage.setItem("originalUsers", JSON.stringify(originalUsers));

    // Session users start as a fresh copy of original users
    usersData = [...originalUsers];

    renderCurrentPage();
  } catch (err) {
    alert("Failed to fetch users.");
    console.error(err);
  } finally {
    loading.classList.add("hidden");
  }
}


// =============================
// Render Users
// =============================
function renderUsers(users) {
  userTable.innerHTML = "";
  users.forEach((user) => {
    userTable.innerHTML += `
      <tr>
        <td>${user.id}</td>
        <td><img src="${user.avatar || "https://via.placeholder.com/40"}" alt="avatar"></td>
        <td>${user.first_name || user.name || ""} ${user.last_name || ""}</td>
        <td>${user.email || "-"}</td>
        <td>
          <button class="edit-btn" data-id="${user.id}">Edit</button>
          <button class="delete-btn" data-id="${user.id}">Delete</button>
        </td>
      </tr>
    `;
  });

  // ✅ Attach events dynamically
  document.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.addEventListener("click", () => openEditModal(btn.dataset.id));
  });
  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", () => deleteUser(btn.dataset.id));
  });
}

// =============================
// Pagination
// =============================
function renderCurrentPage() {
  const start = (currentPage - 1) * 6;
  const end = currentPage * 6;

  usersData = [...originalUsers, ...addedUsers];
  const pageUsers = usersData.slice(start, end);

  currentPageDisplay.textContent = currentPage;
  renderUsers(pageUsers);
}

// Pagination Buttons
nextPage.addEventListener("click", () => {
  const totalPages = Math.ceil(usersData.length / 6);
  if (currentPage < totalPages) {
    currentPage++;
    renderCurrentPage();
  }
});

prevPage.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    renderCurrentPage();
  }
});

// =============================
// Add / Edit Modal
// =============================
addUserBtn.addEventListener("click", () => {
  editingUserId = null;
  editName.value = "";
  editEmail.value = "";
  editModal.classList.remove("hidden");
});

function openEditModal(id) {
  const user = usersData.find((u) => u.id == id);
  if (!user) return;

  editingUserId = id;
  const firstName = user.first_name || user.name?.split(" ")[0] || "";
  const lastName = user.last_name || user.name?.split(" ")[1] || "";

  editName.value = `${firstName} ${lastName}`.trim();
  editEmail.value = user.email || "";
  editModal.classList.remove("hidden");
}

closeModal.addEventListener("click", () => {
  editModal.classList.add("hidden");
});

// =============================
// Save (Add or Update)
// =============================
saveEdit.addEventListener("click", async () => {
  const name = editName.value.trim();
  const email = editEmail.value.trim();
  if (!name || !email) return alert("Please enter name and email");

  const [first_name, last_name] = name.split(" ");

  if (editingUserId) {
    // ✅ Edit existing user (PUT)
    const user = usersData.find((u) => u.id == editingUserId);
    if (user) {
      user.first_name = first_name || "";
      user.last_name = last_name || "";
      user.email = email;
    }
    localStorage.setItem("addedUsers", JSON.stringify(addedUsers));
    showSuccessModal("User updated successfully!");
  } else {
    // ✅ Add new user
    let nextId = parseInt(localStorage.getItem("nextUserId") || "13", 10);
    const newUser = {
      id: nextId,
      first_name,
      last_name,
      email,
      avatar: "https://via.placeholder.com/40",
    };

    addedUsers.push(newUser);
    

    nextId++;
    

    showSuccessModal(`New user "${name}" added successfully!`);
  }

  usersData = [...originalUsers, ...addedUsers];
  renderCurrentPage();
  editModal.classList.add("hidden");
});

// =============================
// Delete User
// =============================
async function deleteUser(id) {
  showConfirmModal(`Are you sure you want to delete user ID ${id}?`, () => {
    // Check if in addedUsers
    if (addedUsers.some((u) => u.id == id)) {
      addedUsers = addedUsers.filter((user) => user.id != id);
    } else {
      // Delete from session-only originalUsers
      originalUsers = originalUsers.filter((user) => user.id != id);
    }

    // Refresh table
    usersData = [...originalUsers, ...addedUsers];
    renderCurrentPage();

    showSuccessModal(`User with ID ${id} deleted successfully!`);
  });
}


// =============================
// Search Filter
// =============================
searchBar.addEventListener("input", () => {
  const query = searchBar.value.toLowerCase();

  // Get current page users only
  const start = (currentPage - 1) * 6;
  const end = currentPage * 6;
  const currentPageUsers = usersData.slice(start, end);

  // Filter based on current page
  const filtered = currentPageUsers.filter((user) => {
    const fullName = `${user.first_name || user.name || ""} ${user.last_name || ""}`.toLowerCase();
    return (
      fullName.startsWith(query) || // Match by first letters
      (user.email && user.email.toLowerCase().startsWith(query)) // Or email first letter
    );
  });

  // Show filtered results
  renderUsers(filtered);

  // If search is empty, restore current page view
  if (!query) {
    renderCurrentPage();
  }
});


// =============================
// Success Modal
// =============================
function showSuccessModal(message) {
  const modal = document.getElementById("successModal");
  const messageEl = document.getElementById("successMessage");
  messageEl.textContent = message || "Action completed successfully!";
  modal.classList.remove("hidden");
}

document.getElementById("closeSuccessModal").addEventListener("click", () => {
  document.getElementById("successModal").classList.add("hidden");
});

// =============================
// Custom Confirm Modal
// =============================
function showConfirmModal(message, onConfirm) {
  const modal = document.getElementById("confirmModal");
  const msg = document.getElementById("confirmMessage");
  const yesBtn = document.getElementById("confirmYes");
  const noBtn = document.getElementById("confirmNo");

  msg.textContent = message || "Are you sure?";
  modal.classList.remove("hidden");

  // Reset listeners to avoid stacking
  yesBtn.replaceWith(yesBtn.cloneNode(true));
  noBtn.replaceWith(noBtn.cloneNode(true));

  const newYesBtn = document.getElementById("confirmYes");
  const newNoBtn = document.getElementById("confirmNo");

  newYesBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
    if (typeof onConfirm === "function") onConfirm();
  });
  newNoBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
  });
}

// =============================
// Initial Load
// =============================
// =============================
// Initial Load
// =============================
document.addEventListener("DOMContentLoaded", () => {
  currentPage = 1;

  // LocalStorage se sirf ORIGINAL users load karo
  const savedOriginals = JSON.parse(localStorage.getItem("originalUsers")) || [];
  
  if (savedOriginals.length > 0) {
    // Original untouched users load
    originalUsers = savedOriginals;
    // Session ke liye copy banao
    usersData = [...originalUsers];
    renderCurrentPage();
  } else {
    // Pehli baar API se fetch karo aur save karo
    fetchOriginalUsers();
  }
});

