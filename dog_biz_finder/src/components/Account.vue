<template>
  <v-container>
    <v-row>
      <v-col :cols="4">
        <v-avatar size="250" tile>    
          <v-img v-bind:src="getPic">
          </v-img>
        </v-avatar>
        
        <ChangeProfilePic class="d-flex align-end mx-4" />
      </v-col>
      
      <v-col :cols="8">
        <v-card shaped outlined height="240">
          <v-card-title class="mb-4">
            {{ user.name }}
          </v-card-title>
          <v-card-subtitle class="d-flex justify-start">
            Account type: {{ user.accountType }}
          </v-card-subtitle>
          <v-card-text class="d-flex justify-start">
            Email: {{ user.email }}
          </v-card-text>
          <v-card-actions>
            <v-btn text @click="showAccountOptions">Account settings</v-btn>
          </v-card-actions>
          <v-card-actions v-show="accountOptions">
            <!-- only if the sign up method is through email/password, show option to change pw -->
            <update-pw-form v-if="user.signInMethod === 'password'"/>
            <delete-account-form :signInMethod="user.signInMethod"/>            
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import ChangeProfilePic from "@/components/ChangeProfilePic"
import UpdatePwForm from "@/components/UpdatePwForm";
import DeleteAccountForm from "@/components/DeleteAccountForm";
import { mapState, mapActions, mapGetters } from "vuex";



export default {
  name: "Account",
  components: {
    UpdatePwForm,
    DeleteAccountForm,
    ChangeProfilePic
  },
  data: () => ({
    accountOptions: false,
  }),
  methods: {
    ...mapActions({
      getCurrentUser: "profileModule/getCurrentUser",
    }),
    showAccountOptions() {
      this.accountOptions = !this.accountOptions;
    }
  },
  computed: {
    ...mapState("profileModule", {
      user: (state) => state.user,
    }),
    ...mapGetters({
      getPic: "profileModule/getPic",
      userName: "profileModule/getName",
      userId: "profileModule/getId",
    })
  },
  created() {
    this.getCurrentUser();
  },
};
</script>

<style lang="scss" scoped></style>
