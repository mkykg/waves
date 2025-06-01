import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendEmailVerification,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-storage.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCyrQ6e7114SejF2d-QAOBSzOkOKkMVVfs",
    authDomain: "waveschat-9534d.firebaseapp.com",
    projectId: "waveschat-9534d",
    storageBucket: "waveschat-9534d.firebasestorage.app",
    messagingSenderId: "361649856978",
    appId: "1:361649856978:web:3c4b67b09cd37062b9280b",
    measurementId: "G-3P5P1SZQQ7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const storage = getStorage(app);
const db = getFirestore(app);

let currentProfilePictureFile = null;

document.addEventListener('DOMContentLoaded', () => {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginButton = document.getElementById('loginButton');
    const signupButton = document.getElementById('signupButton');

    const uploadButton = document.getElementById('uploadImageButton');
    const continueButton = document.getElementById('continueButton');
    const uploadModal = document.getElementById('uploadModal');
    const closeButton = document.querySelector('.close-button');
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');
    const defaultPfp = document.querySelector('.defaultpfp');
    const fileNameDisplay = document.getElementById('fileNameDisplay');

    if (signupButton) {
        signupButton.addEventListener('click', () => {
            const email = emailInput.value;
            const password = passwordInput.value;

            createUserWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    const user = userCredential.user;

                    sendEmailVerification(user)
                        .then(() => {
                            alert('Sign up successful! A verification email has been sent to your inbox. Please verify your email before logging in.');
                            window.location.href = 'login.html';
                        })
                        .catch((error) => {
                            alert(`Sign up successful, but failed to send verification email: ${error.message}. Please try logging in and check for the verification prompt.`);
                            window.location.href = 'login.html';
                        });
                })
                .catch((error) => {
                    const errorMessage = error.message;
                    alert(`Sign up failed: ${errorMessage}`);
                });
        });
    }

    if (loginButton) {
        loginButton.addEventListener('click', () => {
            const email = emailInput.value;
            const password = passwordInput.value;

            signInWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    const user = userCredential.user;

                    if (user.emailVerified) {
                        alert('Login successful!');
                        window.location.href = 'chatui.html';
                    } else {
                        signOut(auth).then(() => {
                            alert('Your email is not verified. Please check your inbox for a verification link or sign up again to receive a new one.');
                        }).catch((error) => {
                            alert('Login successful, but your email is not verified. Please refresh and try again.');
                        });
                    }
                })
                .catch((error) => {
                    const errorMessage = error.message;
                    alert(`Login failed: ${errorMessage}`);
                });
        });
    }

    if (uploadButton && continueButton) {
        uploadButton.onclick = function() {
            uploadModal.style.display = 'flex';
        };

        closeButton.onclick = function() {
            uploadModal.style.display = 'none';
            fileNameDisplay.textContent = '';
            currentProfilePictureFile = null;
        };

        window.onclick = function(event) {
            if (event.target === uploadModal) {
                uploadModal.style.display = 'none';
                fileNameDisplay.textContent = '';
                currentProfilePictureFile = null;
            }
        };

        dropArea.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            handleFiles(e.target.files);
        });

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, highlight, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.classList.remove('highlight');
        });

        function highlight(e) {
            dropArea.classList.add('highlight');
        }

        function handleDrop(e) {
            let dt = e.dataTransfer;
            let files = dt.files;
            handleFiles(files);
        }

        function handleFiles(files) {
            if (files.length === 0) {
                fileNameDisplay.textContent = '';
                currentProfilePictureFile = null;
                return;
            }
            const file = files[0];
            if (!file.type.startsWith('image/')) {
                fileNameDisplay.textContent = 'Please upload an image file.';
                currentProfilePictureFile = null;
                return;
            }

            currentProfilePictureFile = file;
            fileNameDisplay.textContent = `Selected: ${file.name}`;

            let reader = new FileReader();
            reader.onload = function(e) {
                defaultPfp.src = e.target.result;
                uploadModal.style.display = 'none';
                fileNameDisplay.textContent = '';
            };
            reader.readAsDataURL(file);
        }

        continueButton.addEventListener('click', async () => {
            const user = auth.currentUser;
            if (!user) {
                alert('You must be logged in to set a profile picture.');
                window.location.href = 'login.html';
                return;
            }

            let profilePictureUrl = defaultPfp.src;

            if (currentProfilePictureFile) {
                try {
                    const storageRef = ref(storage, `profile_pictures/${user.uid}/profile.jpg`);
                    await uploadBytes(storageRef, currentProfilePictureFile);
                    profilePictureUrl = await getDownloadURL(storageRef);
                    alert('Profile picture uploaded successfully!');
                } catch (error) {
                    alert(`Failed to upload profile picture: ${error.message}. Using default.`);
                }
            }

            try {
                await setDoc(doc(db, 'users', user.uid), {
                    profilePictureUrl: profilePictureUrl,
                    email: user.email
                }, { merge: true });
                alert('Profile picture saved successfully to your profile!');
                window.location.href = 'chatui.html';
            } catch (error) {
                alert(`Failed to save profile picture URL: ${error.message}.`);
            }
        });

        onAuthStateChanged(auth, async (user) => {
            if (user) {
                const userDocRef = doc(db, 'users', user.uid);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                    const userData = userDocSnap.data();
                    if (userData.profilePictureUrl) {
                        defaultPfp.src = userData.profilePictureUrl;
                    }
                }
            }
        });
    }

    onAuthStateChanged(auth, (user) => {
        const currentPath = window.location.pathname;

        if (user) {
            if (user.emailVerified) {
                if (currentPath.includes('login.html') || currentPath.includes('signup.html')) {
                    window.location.href = 'chatui.html';
                }
            } else {
                if (currentPath.includes('chatui.html')) {
                    alert('Your email is not verified. Please verify to access the chat.');
                    signOut(auth);
                    window.location.href = 'login.html';
                }
            }
        } else {
            if (currentPath.includes('chatui.html')) {
                window.location.href = 'login.html';
            }
        }
    });
});
