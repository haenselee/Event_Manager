import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CheckoutSessionResponse {
  url: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {

  private apiUrl = 'http://localhost:8080/api/payments';

  constructor(private http: HttpClient) {}

  createCheckoutSession(registrationId: number): Observable<CheckoutSessionResponse> {
    return this.http.post<CheckoutSessionResponse>(
      `${this.apiUrl}/checkout/${registrationId}`,
      {}
    );
  }
}
