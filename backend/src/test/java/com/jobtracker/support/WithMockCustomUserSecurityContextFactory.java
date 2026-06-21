package com.jobtracker.support;

import com.jobtracker.security.CustomOAuth2User;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.test.context.support.WithSecurityContextFactory;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public class WithMockCustomUserSecurityContextFactory
        implements WithSecurityContextFactory<WithMockCustomUser> {

    @Override
    public SecurityContext createSecurityContext(WithMockCustomUser annotation) {
        UUID userId = UUID.fromString(annotation.userId());

        Map<String, Object> attributes = Map.of(
                "sub",   "google-" + userId,
                "email", annotation.email(),
                "name",  annotation.name()
        );

        OAuth2User delegate = new DefaultOAuth2User(
                List.of(new SimpleGrantedAuthority("ROLE_USER")),
                attributes,
                "sub"
        );

        CustomOAuth2User principal = new CustomOAuth2User(delegate, userId);

        OAuth2AuthenticationToken auth = new OAuth2AuthenticationToken(
                principal,
                principal.getAuthorities(),
                "google"
        );

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(auth);
        return context;
    }
}
