import { Request } from 'express';
import { ModuleRef } from '@nestjs/core';
import { Strategy } from 'passport-local';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { PassportStrategy } from '@nestjs/passport';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private moduleRef: ModuleRef, private authService: AuthService) {
    super({
      passReqToCallback: true, // Pass request object to the callback
      usernameField: 'email', // Customize the username field if necessary
      passwordField: 'password', // Customize the password field if necessary
    });
  }

  async validate(request: Request, username: string, password: string): Promise<any> {
    // Validate the user's credentials using the AuthService
    const user = await this.authService.validateCredentials(username, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
  }
}
