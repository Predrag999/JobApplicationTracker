package com.jobtracker.config;

import com.jobtracker.service.CustomOAuth2UserService;
import com.jobtracker.service.CustomOidcUserService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final CustomOAuth2UserService oAuth2UserService;
    private final CustomOidcUserService oidcUserService;

    public SecurityConfig(CustomOAuth2UserService oAuth2UserService, CustomOidcUserService oidcUserService) {
        this.oAuth2UserService = oAuth2UserService;
        this.oidcUserService = oidcUserService;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(Customizer.withDefaults())
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**", "/oauth2/**", "/login/**", "/error").permitAll()
                .anyRequest().authenticated()
            )
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"message\":\"Unauthorized\",\"authenticated\":false}");
                })
            )
            .oauth2Login(oauth2 -> oauth2
                .userInfoEndpoint(info -> info
                    .userService(oAuth2UserService)
                    .oidcUserService(oidcUserService)
                )
                .successHandler((request, response, authentication) ->
                    response.sendRedirect("http://localhost:5173"))
                .failureHandler((request, response, exception) ->
                    response.sendRedirect("http://localhost:5173?error=auth"))
            )
            .logout(logout -> logout
                .logoutUrl("/api/auth/logout")
                .logoutSuccessHandler((request, response, authentication) -> {
                    response.setStatus(HttpServletResponse.SC_OK);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"authenticated\":false}");
                })
                .deleteCookies("JSESSIONID")
                .invalidateHttpSession(true)
            );

        return http.build();
    }
}
