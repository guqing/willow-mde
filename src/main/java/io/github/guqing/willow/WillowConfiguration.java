package io.github.guqing.willow;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.server.RouterFunction;
import org.springframework.web.reactive.function.server.RouterFunctions;
import org.springframework.web.reactive.function.server.ServerResponse;
import run.halo.app.plugin.ReactiveSettingFetcher;

/**
 * Configuration for willow MDE plugin.
 *
 * @author guqing
 * @since 1.1.0
 */
@Component
@RequiredArgsConstructor
public class WillowConfiguration {

    private final ReactiveSettingFetcher settingFetcher;

    @Bean
    RouterFunction<ServerResponse> editorOptionsRouter() {
        return RouterFunctions.route()
            .GET("/apis/api.willow.guqing.github.io/editor-options",
                request -> settingFetcher.getValues()
                    .flatMap(result -> ServerResponse.ok()
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(result)
                    )
            )
            .build();
    }
}
