import Vue from "vue";
import Vuex from "vuex";
import firebase from "firebase";
import axios from 'axios'

Vue.use(Vuex);

const state = {
    user: {
        name: "",
        email: "",
        accountType: "",
        signInMethod: "",
        uid: "",
        picURL:""
    }
};

const mutations = {
    LOAD_USER(state, payload) {
        state.user = payload;
    },
    UPDATE_USER_TYPE(state, payload) {
        state.user.accountType = payload;
    },
    UPDATE_PROFILE_PIC(state, payload){
        state.user.picURL = payload.picURL;
    },
};

const actions = {
    getCurrentUser,
    updatePw,
    deleteUser,
    updateAccountType,
    updateProfilePic,
    addUserToDb,
    deleteSocialUser
};

const getters = {
    accountType: (state) => state.user.accountType,
    signInMethod: (state) => state.user.signInMethod,
    getUid: (state) => state.user.uid,
    getName: (state) => state.user.name,
    getId: (state) => state.user.id,
    getPic: (state) => state.user.picURL
};

//get the accountType from the db if any
function getAccountInfo(user) {
    let uid = user.uid
        //take the uid returned from firebase go find a user with the uid in db and return their user type if any
    let accountTypeResponse = axios.get(`http://dogpeeps?action=getUserInfo&uid=${uid}`)
        .then(res => {
            console.log(res);
            let info = {}
            info['userType'] = res.data['user_type']
            info['id'] = res.data['id']
            if(!res.data['profile_pic']){
                info['profilePic'] = 'http://dogpeeps/uploads/profile_icon.png'
            } else{
                info['profilePic'] = res.data['profile_pic']
            }
            return info
        })
        .catch(err => console.log(err))   
        return accountTypeResponse   
}








//____________DO YOU NEED TO EDIT/UPDATE THE DB? CHECK THIS OUT__________________________

//for some reason axios kinda sucks when it comes to posting things to the db in a 
//form-like fashion. The default syntax for axios.post that I saw online had us posting a simple js object
//where "params" is now

//that generated no errors in js but php was like "what object? I don't see shit"
//oddly enough passing these objects through a URLSearchParams object made the parameters visible to php
//my understanding is that URLSearchParams translates it into a format similar to URL parameters.

//this function updates the user type when you click on the business/personal box

async function updateAccountType({ commit }, accountParams) {
    const params = new URLSearchParams();
    params.append('action', 'updateAccountType');
    params.append('accType', accountParams.accType);
    params.append('uid', accountParams.uid);
    await axios.post('http://dogpeeps', params) //
        .then(res => {
            console.log(res.data)
            return accountParams.accType
        })
        .catch(err => console.log(err))
    commit("UPDATE_USER_TYPE", accountParams.accType)
}




//here I made this an async function and use "await"
// this is because it was committing "LOAD_USER" before it got the account type
// from the backend. "await" tells the function to chill until it gets the axios Response
// in getAccountType. 
//it's the same as putting the commit(LOAD_USER) in a .then()

//Get current user objet from firbase
async function getCurrentUser({ commit }) {
    let currUser = firebase.auth().currentUser;
    let accountInfo = await getAccountInfo(currUser)
    console.log(currUser.providerData[0].providerId);
    commit("LOAD_USER", {
        name: currUser.displayName,
        email: currUser.email,
        accountType: accountInfo.userType,
        signInMethod: currUser.providerData[0].providerId,
        uid: currUser.uid,
        id: accountInfo.id,
        picURL:accountInfo.profilePic,
        

    });
}

//Reauthenticate the current user's password before carrying out security-sensitive actions
function reauthenticate(currentPw) {
    let currentUser = firebase.auth().currentUser;
    let credential = firebase.auth.EmailAuthProvider.credential(
        currentUser.email,
        currentPw
    );
    //Return true if credentials are correct and pass the value
    return currentUser
        .reauthenticateWithCredential(credential)
        .then(() => {
            console.log("reauthentication success");
            return true;
        })
        .catch((error) => {
            console.log("reauthentication failed", error);
            // if password is incorrect, notify the user so they know to try and reenter current pw
            if (error.code === "auth/wrong-password") {
                alert('You\'ve entered the wrong password. Please try again.');
            } else if (error.code === "auth/too-many-requests") {
                alert('You\'ve had too many attempts. Try again in a bit! :)');
            }
            return false;
        });
}

/**
 * reauthenticate a Google user with a popup window
 */
// function reauthenticateSocAcc() {
//     let currentUser = firebase.auth().currentUser;
//     let provider = new firebase.auth.GoogleAuthProvider()
//     return currentUser
//         //does not work with .reauthenticateWithRedirect
//         .reauthenticateWithPopup(provider)
//         .then(() => {
//             console.log('social reauthentication success');
//             return true;
//         })
//         .catch((error) => {
//             console.log("social reauthentication failed", error);            
//             return false;
//         });
// }

//Update the current user's password, after first reauthenticating the user
function updatePw(a, parameters) {
    let currentUser = firebase.auth().currentUser;
    //Call reauthenticate, pass on reauthResult(Boolean); if true (reauthentication successful) then update password
    reauthenticate(parameters.currentPw).then((reauthResult) => {
        if (reauthResult) {
            currentUser
                .updatePassword(parameters.confirmPw)
                .then(() => {
                    console.log("Password update successful");
                    //After updating pw, log user out so they can sign back in with new pw
                    logout(parameters.router);
                })
                .catch(function(error) {
                    console.log("Password update unsuccessful ", error);
                });
        }
    });
}

//add a user to db

function addUserToDb(a,creationParams){
    const params = new URLSearchParams();
    params.append('action', 'createUser');
    params.append('login', creationParams.displayName);
    params.append('email', creationParams.email);
    params.append('uid', creationParams.uid);

    axios.post('http://dogpeeps',params)//)
        //after the db has the new member, send the user to the home page
        .then(res => {
        console.log(res.data)
        creationParams.router.push('/profile'); 
        })
        .catch(err => console.log(err))
}


//Delete user's account, after first reauthenticating the user
function deleteUser(a, parameters) {
    let currUser = firebase.auth().currentUser;
    console.log('deleteUser() params', parameters)
        //Call reauthenticate, pass on reauthResult(Boolean); if true (reauthentication successful) then delete account
    reauthenticate(parameters.currentPw).then((reauthResult) => {
        if (reauthResult) {
            currUser
                .delete()
                .then(function() {
                    delUserFromDb(currUser);
                    //After deleting the account, log the user out 
                    logout(parameters.router);
                })
                .catch(function(error) {
                    console.log("Delete user unsuccessful", error);
                });
        }
    });
}

/**
 * 
 * @param {*} a placeholder
 * @param {*} route obj that contains the route from the frontend to log out after deletion
 */
function deleteSocialUser(a,route) {
    let currUser = firebase.auth().currentUser;
    let provider = new firebase.auth.GoogleAuthProvider()
    console.log('deleteUser Social params', currUser.xa)
    currUser.reauthenticateWithPopup(provider).then((reauthResult) => {
    // reauthenticateSocAcc().then((reauthResult) => {
        console.log('I got the result', reauthResult)
        if (reauthResult) {
            currUser
                .delete()
                .then(function() {
                    delUserFromDb(currUser);
                    //After deleting the account, log the user out 
                    logout(route);
                })
                .catch(function(error) {
                    console.log("Delete user unsuccessful", error);
                });
        }
    });
}

async function updateProfilePic ({commit}, picParams){
    let linkURL = `http://dogpeeps/uploads/${picParams.username}/${picParams.filename}`
    const params = new URLSearchParams();
    params.append('action', 'updateProfilePicInDB');
    params.append('id', picParams.id);
    params.append('url', linkURL);
    await axios.post('http://dogpeeps', params) //)
        .then(res => {
            console.log(res.data)
            //creationParams.router.push('/');

        })
        .catch(err => console.log(err))
    //update the state after updating the db
    commit('UPDATE_PROFILE_PIC',{
        // id:picParams.id,
        picURL:linkURL
    })

}


/**
 * 
 * @param {*} a placeholder
 * @param {*} parameters a currentUser obj that contain uid of the user needed to delete the account from db
 */
function delUserFromDb(parameter) {
    const params = new URLSearchParams();
    params.append('action', 'removeAccount');
    params.append('uid', parameter.uid);
    axios.post('http://dogpeeps',params)//)
        .then(res => {
            console.log(res.data)  
        })
        .catch(err => console.log(err))
}

//Log current user out
function logout(router) {
    firebase
        .auth()
        .signOut()
        .then(() => {
            router.go({ path: router.path });
            console.log("signout successful");
        });
}


export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations,
};