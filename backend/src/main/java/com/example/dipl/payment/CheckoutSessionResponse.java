package com.example.dipl.payment;

public class CheckoutSessionResponse {

    private String url;

    public CheckoutSessionResponse(String url) {
        this.url = url;
    }

    public String getUrl() {
        return url;
    }
}