const loginButton = document.getElementById("send-user");
const chatBox = document.getElementById("chat-box");
const usersBox = document.getElementById("online-users");
const sendMsg = document.getElementById("send-message");
const navButton = document.getElementById("nav-button");
const navBack = document.getElementById("nav-background");
const navBar = document.getElementById("nav-bar");
const privateOption = document.getElementById("private_message");
const publicOption = document.getElementById("message");
const sendingToAll = document.getElementById("0");
const enterKey = 13;
const drivenApi = "https://mock-api.driven.com.br/api/v6/uol/";
loginButton.addEventListener("click", validateUserAndLogin);
navButton.addEventListener("click", openNavBar);
navBack.addEventListener("click", closeNavBar);
window.addEventListener("keydown", enterToLogin);

function enterToLogin(e) {
  if (e.which === enterKey) {
    validateUserAndLogin();
  }
}

function openNavBar() {
  console.log("nav-bar", navBar);
  navBack.classList.add("show-background-nav");
  navBar.classList.add("nav-open");
}

function closeNavBar(e) {
  if (e.target.id !== navBar.id) {
    navBack.classList.remove("show-background-nav");
    navBar.classList.remove("nav-open");
  }
}

function validateUserAndLogin() {
  const name = document.getElementById("username").value;
  axios.post(drivenApi + "participants", {
    name: name
  })
    .then(() => {
      login(name);
    })
    .catch(error => {
      console.log(error);
      const errorMsg = loginButton.previousElementSibling;
      if (error.response.status === 400) {
        errorMsg.innerText = "username typed is either empty or used";
      } else {
        errorMsg.innerText = "failed to communicate with server";
      }
      errorMsg.classList.add("show");
    });
}

function login(name) {
  const loginPage = document.getElementById("login-page");
  loginPage.classList.add("hidden");
  new User(name);
}

class User {
  constructor(name) {
    this.name = name;
    this.msgRecipient = "0";
    this.selectedName = "";
    this.lastMessageTime = "";
    this.type = "message";
    this.users = [{ name: "Todos" }];
    window.removeEventListener("keydown", enterToLogin);
    window.addEventListener("keydown", this.enterToSend.bind(this));
    sendingToAll.addEventListener("click", this.selectRecipient.bind(this));
    sendMsg.addEventListener("click", this.postMessage.bind(this));
    privateOption.addEventListener("click", this.selectPrivacy.bind(this));
    publicOption.addEventListener("click", this.selectPrivacy.bind(this));
    this.updateChatMessages();
    this.updateUsersOnline();
    this.updateMessageTypeStatus();
    setInterval(this.keepConnectionAlive.bind(this), 5000);
    setInterval(this.updateUsersOnline.bind(this), 7000);
    setInterval(this.updateChatMessages.bind(this), 3000);
    console.log("I'm getting created");
  }
  enterToSend(e) {
    if (e.which === enterKey) {
      this.postMessage();
    }
  }
  updateMessageTypeStatus() {
    const typeStatus = document.getElementById("type-status");
    console.log("updateMessageTypeStatus");
    console.log("this.users", this.users);
    console.log("this.msgRecipient", this.msgRecipient);
    console.log("updateMessageTypeStatus");
    typeStatus.innerText = `Enviando para ${this.users[this.msgRecipient].name}`;
    if (this.type === "private_message") {
      typeStatus.innerText += " (reservadamente)";
    }
  }
  keepConnectionAlive() {
    axios.post(drivenApi + "status", {
      name: this.name
    });
  }
  updateChatMessages() {
    axios.get(drivenApi + "messages")
      .then(response => {
        const messages = response.data;
        let newInnerHTML = "";
        let changed = false;
        for (let i = messages.length - 1; i >= 0 && messages[i].time !== this.lastMessageTime; i--) {
          let visibility = "";
          changed = true;
          if (messages[i].type === "private_message") {
            visibility = "reservadamente";
          }
          newInnerHTML = `
            <div class="chat-line ${messages[i].type}">
            <p>
              (${messages[i].time})  <span class="strong"> ${messages[i].from} </span> ${visibility} para
                <span class="strong"> ${messages[i].to}</span>: ${messages[i].text}
            </p>
            </div>
          ` + newInnerHTML;
        }
        if (changed) {
          chatBox.innerHTML += newInnerHTML;
          this.lastMessageTime = messages[messages.length - 1].time;
          chatBox.lastElementChild.scrollIntoView();
        }
      });
  }
  postMessage() {
    const msgText = document.getElementById("message-text");
    if (msgText.value) {
      axios.post(drivenApi + "messages", {
        from: this.name,
        to: this.users[this.msgRecipient].name,
        text: msgText.value,
        type: this.type
      })
        .then(() => {
          msgText.value = "";
        });
    }
  }
  updateUsersOnline() {
    axios.get(drivenApi + "participants")
      .then(response => {
        this.users = [{ name: "Todos" }];
        this.users = this.users.concat(response.data);
        let newElement;
        usersBox.innerHTML = "";
        let selectedPersisted = false;
        for (let i = 1; i < this.users.length; i++) {
          if (this.name === this.users[i].name) {
            continue;
          }
          newElement = document.createElement("div");
          newElement.classList.add("nav-line");
          newElement.id = i;
          newElement.innerHTML = `
          <ion-icon name="person-circle"></ion-icon>
          <p>${this.users[i].name}</p>
          `;
          if (this.selectedName === this.users[i].name) {
            selectedPersisted = true;
            newElement.innerHTML += `<img src="./assets/images/checkmark.png" alt="choosen option">`;
            this.msgRecipient = i.toString();
          }
          usersBox.appendChild(newElement);
          newElement.addEventListener("click", this.selectRecipient.bind(this));
        }
        if (!selectedPersisted && this.msgRecipient !== "0") {
          console.log("msgRecipient", this.msgRecipient);
          console.log(typeof (this.msgRecipient));
          console.log("the last one disappeared, police!!!");
          sendingToAll.innerHTML += `<img src="./assets/images/checkmark.png" alt="choosen option">`;
          this.msgRecipient = "0";
          this.type = "message";
        }
      });
  }
  selectOption(clickedElement, attr) {

    if (this[attr] === clickedElement.id) {
      return;
    }
    const oldRecipient = document.getElementById(this[attr]);
    console.log("oldRecipient", oldRecipient);
    console.log('oldRecipient.lastElementChild', oldRecipient.lastElementChild);
    oldRecipient.removeChild(oldRecipient.lastElementChild);
    this[attr] = clickedElement.id;
    clickedElement.innerHTML += `<img src="./assets/images/checkmark.png" alt="choosen option">`;
    this.updateMessageTypeStatus();
  }
  selectRecipient(e) {
    this.selectOption(e.currentTarget, "msgRecipient");
    this.selectedName = this.users[e.currentTarget.id].name;
    if (this.selectedName === "Todos" && this.type === "private_message") {
      this.selectOption(publicOption, "type");
    }
  }
  selectPrivacy(e) {
    if (e.currentTarget.id === "private_message" && this.users[this.msgRecipient].name === "Todos") {
      return;
    }
    this.selectOption(e.currentTarget, "type");
  }
}