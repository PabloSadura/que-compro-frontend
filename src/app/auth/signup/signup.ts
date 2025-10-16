import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './signup.html',
})
export class SignupComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  loading = signal(false);
  error = signal<string | null>(null);

  // Señal para controlar la visibilidad de la contraseña
  showPassword = signal(false);

  async onSignup() {
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.authService.signup(this.email, this.password);
      this.router.navigate(['/']);
    } catch (err: any) {
      this.error.set('No se pudo crear la cuenta. Inténtalo de nuevo.');
    } finally {
      this.loading.set(false);
    }
  }

  async onGoogleLogin() {
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.authService.loginWithGoogle();
      this.router.navigate(['/']);
    } catch (err: any) {
      this.error.set('No se pudo registrar con Google.');
    } finally {
      this.loading.set(false);
    }
  }
}
