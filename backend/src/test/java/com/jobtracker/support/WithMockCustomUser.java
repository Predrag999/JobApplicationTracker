package com.jobtracker.support;

import org.springframework.security.test.context.support.WithSecurityContext;

import java.lang.annotation.*;

/**
 * Place on a test method (or class) to inject a {@link com.jobtracker.security.CustomOAuth2User}
 * principal into the Spring Security context, simulating a logged-in Google user.
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Inherited
@WithSecurityContext(factory = WithMockCustomUserSecurityContextFactory.class)
public @interface WithMockCustomUser {
    String userId() default "00000000-0000-0000-0000-000000000001";
    String email()  default "test@example.com";
    String name()   default "Test User";
}
