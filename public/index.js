const input = document.getElementById("search-users");
const usersContainer = document.getElementById("users-container");
const addUserBtn = document.getElementById("add-user-btn");
const addUserSection = document.getElementById("add-users-section");
const closeUserSection = document.getElementById("close-user-form");
const userFormHeader = document.getElementById("user-h1");
const profileImg = document.getElementById("profile-img");
const fileInput = document.getElementById("file-input");
const faUser = document.getElementById("fa-user");
const formInputName = document.getElementById("name-input");
const formInputUsername = document.getElementById("username-input");
const formInputEmail = document.getElementById("email-input");
const userFormBtn = document.getElementById("user-form-btn");
const removeProfileImgBtn = document.getElementById("remove-profile-image");

const baseUrl = "http://users-select-dev.eu-north-1.elasticbeanstalk.com/";
const classArray = [profileImg, removeProfileImgBtn];

let data;
let editUser;
let searchContainer = [];
let currentName;
let currentUsername;
let currentEmail;
let previousFile = null;
let file = null;
let fileToDelete = null;

async function featchUsers() {
    const res = await fetch(`${baseUrl}users`, {method: "GET"});
    data = await res.json();
    searchContainer = data.info
    renderUserCard();
}

function searchFilter() {
    usersContainer.innerHTML = "";
    searchContainer = [];
    for (let i = 0; i < data.info.length; i++) {
        if (data.info[i].full_name.toLowerCase().includes(input.value.toLowerCase()) || data.info[i].username.toLowerCase().includes(input.value.toLowerCase())) {
            searchContainer.push(data.info[i]);
        }
    }
    renderUserCard();
}


function renderUserCard(data) {
    const creatUsersArray = data ? [data.user] : searchContainer; 
    creatUsersArray.forEach(element => {
        // container
        const user = document.createElement("div");
        user.classList.add("user");
        
        // profile image
        const profile = document.createElement("div");
        profile.classList.add("profile");
        

        if (element.profile_picture != null) {
            const profilePicture = document.createElement("img");
            profilePicture.classList.add("profile-img");
            profilePicture.src = `/users/${element.profile_picture}`;
            profile.appendChild(profilePicture)
        } else {
            const faUser = document.createElement("i");
            faUser.classList.add("fa-solid", "fa-user");
            profile.append(faUser);
        }
        
        // User information
        const userData = document.createElement("div");
        userData.classList.add("user-data");
        
        const fullName = document.createElement("h3");
        fullName.classList.add("user-h3");
        fullName.textContent = element.full_name;
        
        const userName = document.createElement("p");
        userName.classList.add("user-p");
        userName.textContent = element.username;
        
        const joiendDate = document.createElement("p");
        joiendDate.classList.add("user-p");
        if(data) {
            const date = new Date();
            const month = date.getMonth() + 1 <= 9 ? `0${date.getMonth() + 1}` : date.getMonth() + 1;
            const day = date.getDate() + 1 <= 9 ? `0${date.getDate()}` : date.getDate();
            joiendDate.textContent = `${date.getFullYear()}-${month}-${day}`
        } else {
            joiendDate.textContent = element.creation_date.split('T')[0];
        }
        
        const email = document.createElement("a");
        email.classList.add("user-email");
        email.setAttribute("href", `mailto:${element.email}`);
        
        const faEnvelope = document.createElement("i");
        faEnvelope.classList.add("fa-regular", "fa-envelope");
        
        const edit = document.createElement("div");
        edit.classList.add("user-email", "edit-user");
        edit.setAttribute("id", element.id);
        edit.addEventListener("click", editUsers);
        
        const faEdit = document.createElement("i");
        faEdit.classList.add("fa-solid", "fa-pen-to-square");
        
        email.append(faEnvelope);
        edit.append(faEdit);
        userData.append(fullName, userName, joiendDate, email, edit);
        user.append(profile, userData);
        
        usersContainer.appendChild(user);
    });
    if(data) {
        searchContainer.push(data.user);
    }
}

function formProfileInput() {
    const reader = new FileReader();
    file = fileInput.files[0] || previousFile;
    if (file) {
        reader.readAsDataURL(file);
        reader.onload = function (reader) {
            profileImg.src = reader.target.result;
        }
        if(profileImg.src != "") {
            faUser.classList.add("is-displaying");
            classArray.forEach(element => {
                element.classList.remove("is-displaying");
            })
        } else {
            faUser.classList.remove("is-displaying");
        }
    }
    previousFile = file;
}

function removeProfileImg() {
    fileToDelete = profileImg.src.split("/users/");
    fileToDelete = fileToDelete[1];
    profileImg.src = "";
    classArray.forEach(element => {
        element.classList.add("is-displaying");
    })
    faUser.classList.remove("is-displaying");
}

function formOpen(e) {
    e.preventDefault();
    addUserSection.classList.remove("is-displaying");
    userFormHeader.textContent = "Create account"
    profileImg.classList.add("is-displaying");
}

function formClose() {
    if (!addUserSection.classList.contains("is-displaying")) {
        addUserSection.classList.add("is-displaying");
    }
    faUser.classList.remove("is-displaying");
    profileImg.src = "";
    profileImg.classList.add("is-displaying")
    const resetValues = [formInputName, formInputUsername, formInputEmail, fileInput];
    resetValues.forEach(input => input.value = "");
}

function editUsers(e) {
    addUserSection.classList.remove("is-displaying");
    editUser = Number(e.currentTarget.id);
    searchContainer.forEach(element => { 
        if (element.id == editUser) {
            userFormHeader.textContent = element.full_name;
            formInputName.value = element.full_name;
            formInputUsername.value = element.username;
            formInputEmail.value = element.email;
            currentName = formInputName.value;
            currentUsername = formInputUsername.value;
            currentEmail = formInputEmail.value;
            if (element.profile_picture != null) {
                profileImg.src = `/users/${element.profile_picture}`;
                faUser.classList.add("is-displaying");
                classArray.forEach(element => {
                    element.classList.remove("is-displaying");
                })
            } else {
                faUser.classList.remove("is-displaying");
                classArray.forEach(element => {
                    element.classList.add("is-displaying");
                })
            }
        }      
    })
}

function updateUserFromResponse(data) {
    console.log(data.user);
    const user = document.getElementById(data.user.id);
    user.parentNode.children[0].textContent = data.user.full_name;
    user.parentNode.children[1].textContent = data.user.username;
    user.parentNode.children[3].href = `mailto:${data.user.email}`;
    if (data.user.isImageNew) {
        user.parentNode.parentNode.firstChild.innerHTML = "";
        const profilePicture = document.createElement("img");
        profilePicture.classList.add("profile-img");
        profilePicture.src = `/users/${data.user.file}`;
        user.parentNode.parentNode.firstChild.appendChild(profilePicture)
    } else if (data.user.file == "deleted") {
        user.parentNode.parentNode.firstChild.innerHTML = "";
        const faUser = document.createElement("i");
        faUser.classList.add("fa-solid", "fa-user");
        user.parentNode.parentNode.firstChild.appendChild(faUser)
    }
    
    // Update searchContainer
    searchContainer.forEach(element => {
        if (element.id == data.user.id) {
            if (data.user.isImageNew) {
                element.profile_picture = data.user.file;
            }
            element.full_name = data.user.full_name;
            element.username = data.user.username;
            element.email = data.user.email;
        }
    })
}

async function createUser(e) {
    e.preventDefault();
    const formData = new FormData();
    formData.append("file-input", file);
    formData.append("full_name", formInputName.value);
    formData.append("username", formInputUsername.value);
    formData.append("email", formInputEmail.value);
    
    if (userFormHeader.innerHTML === "Create account") {
        if (usersContainer.childElementCount > 0) {
            const lastId = Number(usersContainer.lastChild.lastChild.lastChild.id) + 1;
            formData.append("lastId", lastId)
        }
        fetch(`${baseUrl}createuser`, {
            method: 'POST',
            body: formData
        }).then(response => response.json())
        .then(data => {
            renderUserCard(data);
        }).catch(error => {
            console.error("Error when updating user", error)
          })
    } else {
        searchContainer.forEach(element => {
            if (element.id == editUser && element.profile_picture != null) {
                formData.append("currentImage", element.profile_picture)
            }
        })
        formData.append("fileToDelete", fileToDelete);
        fetch(`${baseUrl}updateuser/${editUser}`, {
            method: 'PUT',
            body: formData
          }).then(response => response.json())
          .then(data => {
            updateUserFromResponse(data);
        }).catch(error => {
            console.error(error)
        })
    }
    formClose();
    previousFile = null;
    fileToDelete = null;
}

input.addEventListener("input", searchFilter);
fileInput.addEventListener("change", formProfileInput);
addUserBtn.addEventListener("click", formOpen);
closeUserSection.addEventListener("click", formClose);
userFormBtn.addEventListener("click", createUser);
removeProfileImgBtn.addEventListener("click", removeProfileImg);

featchUsers();