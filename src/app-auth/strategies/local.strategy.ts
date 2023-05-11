// import { Request, Response } from 'express'
// import { ModuleRef } from '@nestjs/core'
// import { Strategy } from 'passport-local'
// import { Injectable } from '@nestjs/common'
// import { AuthService } from '../auth/auth.service'
// import { PassportStrategy } from '@nestjs/passport'
//
// @Injectable()
// export class LocalStrategy extends PassportStrategy(Strategy) {
//   constructor(private moduleRef: ModuleRef, private authService: AuthService) {
//     super({
//       passReqToCallback: true,
//       usernameField: '__token',
//       passwordField: '__pass',
//     })
//   }
//
//   async validate(request: Request, response: Response, username?: string, password?: string): Promise<any> {
//     if (request.headers.authorization == undefined) {
//       return res.status(401).json('Missing authorization token')
//     }
//     const token = req.headers.authorization.split(' ')[1]
//     if (token == 'c3962622-8476-406e-952d-2115d90b28b7') {
//       const devUser = {
//         sub: 'c3962622-8476-406e-952d-2115d90b28b7',
//         email_verified: true,
//         iss: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_059VnfheU',
//         'cognito:username': 'c3962622-8476-406e-952d-2115d90b28b7',
//         aud: '728pvgml3836emhcd3vv1kt21k',
//         event_id: '26f6f1b2-b2c6-43bc-918b-5a6c1f7b6c8d',
//         'custom:universityCode': 'demo2020',
//         token_use: 'id',
//         auth_time: 1611826876,
//         'custom:status': 'paid',
//         name: 'Demo User',
//         exp: 1611913276,
//         'custom:isVerified': '1',
//         iat: 1611826876,
//         email: 'demo@learntostart.com',
//         'custom:language': 'en',
//       }
//       isSocket ? (res.user = devUser) : (res.locals.user = devUser)
//
//       next()
//     } else {
//       const pems = {}
//       const keys = jwks['keys']
//       for (let i = 0; i < keys.length; i++) {
//         //Convert each key to PEM
//         const key_id = keys[i].kid
//         const modulus = keys[i].n
//         const exponent = keys[i].e
//         const key_type = keys[i].kty
//         const jwk = { kty: key_type, n: modulus, e: exponent }
//         const pem = jwkToPem(jwk)
//         pems[key_id] = pem
//       }
//       //validate the token
//       const decodedJwt = decode(token, { complete: true })
//       if (!decodedJwt) {
//         if (isSocket) next(new Error('Not a valid JWT token'))
//         else return res.status(401).json('Not a valid JWT token')
//       }
//
//       const kid = decodedJwt && decodedJwt.header && decodedJwt.header.kid ? decodedJwt.header.kid : null
//       const pem = pems[kid]
//       if (!pem) {
//         if (isSocket) next(new Error('Invalid Token'))
//         else return res.status(401).json('Invalid token')
//       }
//
//       verify(token, pem, function (err, payload) {
//         if (err) {
//           if (isSocket) next(new Error('Invalid Token'))
//           else return res.status(401).json('Invalid token')
//         } else {
//           isSocket ? (res.user = payload) : (res.locals.user = payload)
//           next()
//         }
//       })
//     }
//   }
//
//   // let authorization = request.headers.authorization
//   // if (!authorization) throw new UnauthorizedException()
//   // const [_, token] = authorization.split(' ')
//   // if (!token) throw new UnauthorizedException()
//   // const user = await this.authService.checkToken(token)
//   // if (!user) {
//   //   throw new UnauthorizedException()
//   // }
//   // return user
//   // }
// }
