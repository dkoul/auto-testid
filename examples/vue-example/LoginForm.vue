<template>
  <div class="login-form">
    <h2>Welcome Back</h2>
    <p>Please sign in to your account</p>
    
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="email">Email Address</label>
        <input
          id="email"
          type="email"
          v-model="email"
          placeholder="Enter your email"
          required
        />
      </div>

      <div class="form-group">
        <label for="password">Password</label>
        <input
          id="password"
          type="password"
          v-model="password"
          placeholder="Enter your password"
          required
        />
      </div>

      <div class="checkbox-group">
        <input
          id="remember"
          type="checkbox"
          v-model="rememberMe"
        />
        <label for="remember">Remember me</label>
      </div>

      <div class="form-actions">
        <button 
          type="submit" 
          :disabled="loading"
          :class="{ 'loading': loading }"
          class="submit-btn"
        >
          {{ loading ? 'Signing in...' : 'Sign In' }}
        </button>
        
        <a href="/forgot-password" class="forgot-link">
          Forgot your password?
        </a>
      </div>
    </form>

    <div class="signup-prompt">
      <span>Don't have an account?</span>
      <a href="/signup" class="signup-link">Sign up here</a>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LoginForm',
  props: {
    loading: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      email: '',
      password: '',
      rememberMe: false
    }
  },
  methods: {
    handleSubmit() {
      this.$emit('submit', this.email, this.password);
    }
  }
}
</script>

<style scoped>
.login-form {
  max-width: 400px;
  margin: 0 auto;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.checkbox-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.checkbox-group input {
  width: auto;
}

.form-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.submit-btn {
  padding: 0.75rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
}

.submit-btn:hover:not(:disabled) {
  background: #0056b3;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.forgot-link,
.signup-link {
  color: #007bff;
  text-decoration: none;
}

.forgot-link:hover,
.signup-link:hover {
  text-decoration: underline;
}

.signup-prompt {
  text-align: center;
  margin-top: 1.5rem;
  color: #666;
}
</style>
