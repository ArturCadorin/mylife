package com.mylife;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class MylifeBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(MylifeBackendApplication.class, args);
	}

}
