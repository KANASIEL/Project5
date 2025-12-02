package com.boot.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class DummyController {

    @GetMapping("/Dummy")
    public String Dummy(){
        return "Dummy";
    }
}
